import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transaction } from './entities/transaction.entity';
import { Party } from '../../parties/entities/party.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto, TransactionsQueryDto, CreateTransferDto } from '../dto/finance.dto';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { DateUtils } from '../../../common/utils/date.utils';
import { FinanceHelper as FH } from '../../../common/utils/finance.helper';
import dayjs from 'dayjs';
import { Transactional } from '@nestjs-cls/transactional';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';
import { Department } from '../../departments/entities/department.entity';
import { CommercialAccount } from '../accounts/entities/commercial-account.entity';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private transactionContext: TransactionContextService,
  ) {}

  async findAll(query: TransactionsQueryDto, currentUser?: JwtPayload): Promise<PaginatedResult<Transaction>> {
    const qb = this.txRepo.createQueryBuilder('tx')
      .select([
        'tx.id', 'tx.code', 'tx.type', 'tx.amount', 'tx.date', 
        'tx.status', 'tx.description', 'tx.exchangeRate', 'tx.createdAt'
      ])
      .leftJoin('tx.party', 'party')
      .addSelect(['party.id', 'party.name'])
      .leftJoin('tx.commercialAccount', 'commercialAccount')
      .addSelect(['commercialAccount.id', 'commercialAccount.name', 'commercialAccount.bankName'])
      .leftJoin('tx.currency', 'currency')
      .addSelect(['currency.id', 'currency.symbol', 'currency.code']);

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(tx.code LIKE :s OR party.name LIKE :s OR tx.description LIKE :s OR commercialAccount.name LIKE :s OR commercialAccount.bankName LIKE :s)', { s });
    }
    if (query.partyId) qb.andWhere('tx.partyId = :partyId', { partyId: query.partyId });
    if (query.type) qb.andWhere('tx.type = :type', { type: query.type });
    if (query.status) qb.andWhere('tx.status = :status', { status: query.status });

    let deptAccountId: string | null = null;
    if (currentUser && !currentUser.isSystemAdmin) {
      if (currentUser.departmentId) {
        const department = await this.dataSource.getRepository(Department).findOne({
          where: { id: String(currentUser.departmentId) }
        });
        deptAccountId = department?.commercialAccountId || null;
      }
      if (deptAccountId) {
        qb.andWhere('tx.commercialAccountId = :deptAccountId', { deptAccountId });
      } else {
        qb.andWhere('1 = 0');
      }
    } else {
      if (query.commercialAccountId) {
        qb.andWhere('tx.commercialAccountId = :commercialAccountId', { commercialAccountId: query.commercialAccountId });
      }
      if (query.departmentId) {
        const department = await this.dataSource.getRepository(Department).findOne({
          where: { id: String(query.departmentId) }
        });
        if (department && department.commercialAccountId) {
          qb.andWhere('tx.commercialAccountId = :deptFilterAccountId', { deptFilterAccountId: String(department.commercialAccountId) });
        } else {
          qb.andWhere('1 = 0');
        }
      }
    }

    const allowedSortCols = ['date', 'amount', 'createdAt', 'code', 'party.name', 'commercialAccount.name', 'status'];
    const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'date';
    
    const finalSortField = sortField.includes('.') ? sortField : `tx.${sortField}`;
    qb.orderBy(finalSortField, query.sortOrderSafe);

    if (sortField !== 'createdAt') {
      qb.addOrderBy('tx.createdAt', 'DESC');
    }
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const tx = await this.transactionContext.manager.findOne(Transaction, {
      where: { id: String(id) },
      relations: ['party', 'commercialAccount', 'currency'],
    });
    if (!tx) throw new NotFoundException('İşlem bulunamadı');
    return tx;
  }

  @Transactional()
  async create(dto: CreateTransactionDto, userId: string): Promise<Transaction> {
    const manager = this.transactionContext.manager;

    let party: Party | null = null;
    let exchangeRate = new Decimal(1);
    // Cari limit veya bakiye durumu
    const p = dto.partyId ? await manager.findOne(Party, { where: { id: String(dto.partyId) } }) : null;
    if (p && p.type === 'provider' && dto.type === 'in') {
      // Tedarikçiden tahsilat (in) - belki fazla ödeme iadesi
      console.warn(`Tedarikçiden tahsilat işlemi yapılıyor: ${p.name}`);
    }
    if (dto.partyId) {
      party = await manager.findOne(Party, { 
        where: { id: String(dto.partyId) },
        lock: { mode: 'pessimistic_write' }
      });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı');
    }

    const currency = dto.currencyId ? await manager.findOne(Currency, { where: { id: String(dto.currencyId) } }) : null;
    exchangeRate = currency ? new Decimal(currency.exchangeRate) : new Decimal(1);
    const tlAmount = FH.mul(dto.amount, exchangeRate);

    if (party) {
      const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
      const isDebit = dto.type === 'out' || isSupplierRefund;
      
      const newBalance = isDebit 
        ? FH.add(new Decimal(party.balance), tlAmount) 
        : FH.sub(new Decimal(party.balance), tlAmount);

      if (dto.type === 'out' && party.creditLimit.gt(0) && newBalance.gt(party.creditLimit)) {
         throw new BadRequestException(`İşlem limit engeline takıldı. Yapılacak ödeme/harcama firmanın belirlediğiniz limitini aşıyor.`);
      }

      party.balance = newBalance;
      await manager.save(Party, party);
    }

    const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
    const code = await this.sequenceGenerator.generateTransactionCode(manager, prefix);

    const tx = manager.create(Transaction, {
      code, partyId: dto.partyId ? String(dto.partyId) : undefined, commercialAccountId: dto.commercialAccountId ? String(dto.commercialAccountId) : undefined,
      amount: new Decimal(dto.amount), currencyId: dto.currencyId ? String(dto.currencyId) : undefined, exchangeRate,
      type: dto.type, referenceType: dto.referenceType, referenceId: dto.referenceId ? String(dto.referenceId) : undefined,
      date: dto.date, description: dto.description || undefined, status: 'completed', createdBy: userId,
    });

    const savedTx = await manager.save(tx);
    
    if (party) {
      const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
      const isCredit = dto.type === 'in' && !isSupplierRefund;
      const entryDebit = isCredit ? new Decimal(0) : tlAmount;
      const entryCredit = isCredit ? tlAmount : new Decimal(0);
      
      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        accountId: dto.commercialAccountId,
        debit: entryDebit,
        credit: entryCredit,
        transactionId: savedTx.id,
        source: dto.type === 'in' ? 'PAYMENT_IN' : 'PAYMENT_OUT',
        description: dto.description || `Kasa Fişi: ${code}`
      }));

      // --- FIFO ALLOCATION WITH REFERENCE ID PRIORITY ---
      if (isCredit) {
        let remainingPayment = new Decimal(dto.amount);
        
        // 1. If user targeted a specific sale via referenceId, prioritize that sale
        const targetSales: Sale[] = [];
        if (dto.referenceId && (dto.referenceType === 'sale' || dto.referenceType === 'sale_deposit' || !dto.referenceType)) {
          const specificSale = await manager.findOne(Sale, {
            where: { id: String(dto.referenceId), partyId: party.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (specificSale && ['approved', 'shipped', 'invoiced'].includes(specificSale.status)) {
            targetSales.push(specificSale);
          }
        }

        // 2. Fetch other unpaid sales ordered chronologically (FIFO)
        const otherUnpaidSales = await manager.find(Sale, {
          where: [
            { partyId: party.id, status: 'approved' },
            { partyId: party.id, status: 'shipped' },
            { partyId: party.id, status: 'invoiced' },
          ],
          order: { createdAt: 'ASC' },
        });

        for (const s of otherUnpaidSales) {
          if (!targetSales.some((ts) => String(ts.id) === String(s.id))) {
            targetSales.push(s);
          }
        }

        // 3. Process allocation across targetSales
        for (const sale of targetSales) {
          if (remainingPayment.lte(0.0001)) break;

          const grandTotal = new Decimal(sale.grandTotal || 0);
          const paidAmount = new Decimal(sale.paidAmount || 0);
          const remainingDebtOnSale = grandTotal.sub(paidAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

          if (remainingDebtOnSale.gt(0)) {
            const txExchangeRate = exchangeRate;
            const saleExchangeRate = new Decimal(sale.exchangeRate || 1);
            
            const remainingPaymentInTl = remainingPayment.mul(txExchangeRate);
            const remainingPaymentInSaleCurrency = remainingPaymentInTl
              .div(saleExchangeRate)
              .toDecimalPlaces(2, Decimal.ROUND_DOWN);

            const allocationInSaleCurrency = Decimal.min(remainingDebtOnSale, remainingPaymentInSaleCurrency);
            
            if (allocationInSaleCurrency.gt(0)) {
              const newPaidAmount = paidAmount.add(allocationInSaleCurrency).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
              
              sale.paidAmount = newPaidAmount;
              await manager.save(Sale, sale);

              const allocationInTxCurrency = allocationInSaleCurrency
                .mul(saleExchangeRate)
                .div(txExchangeRate)
                .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
              remainingPayment = remainingPayment.sub(allocationInTxCurrency);
            }
          }
        }
      }
      // --- END FIFO ALLOCATION ---


    }

    return this.findOne(String(savedTx.id));
  }

  @Transactional()
  async cancel(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const manager = this.transactionContext.manager;

    const tx = await manager.findOne(Transaction, { where: { id: String(id) }});
    if (!tx || tx.status === 'cancelled') throw new BadRequestException('Sadece tamamlanmış aktif işlemler iptal edilebilir.');

    if (tx.partyId) {
      const party = await manager.findOne(Party, { 
        where: { id: String(tx.partyId) },
        lock: { mode: 'pessimistic_write' }
      });
      if (party) {
        const isSupplierRefund = tx.type === 'in' && party.type === 'provider';
        const isReverseCredit = (tx.type === 'in' && !isSupplierRefund) ? false : true;
        const tlAmount = FH.mul(tx.amount, tx.exchangeRate);
        
        const revDebit = isReverseCredit ? new Decimal(0) : tlAmount;
        const revCredit = isReverseCredit ? tlAmount : new Decimal(0);

        await manager.save(manager.create(AccountingLedger, {
          date: DateUtils.getToday(),
          partyId: party.id,
          accountId: tx.commercialAccountId,
          debit: revDebit,
          credit: revCredit,
          transactionId: tx.id,
          source: 'CANCEL',
          description: `İptal Fişi: ${tx.code}`
        }));

        // --- REVERSE FIFO ALLOCATION ---
        if (!isReverseCredit) {
          let amountToRevert = new Decimal(tx.amount);
          console.log(`[FIFO Payment Cancel] Reverting payment amount ${tx.amount} ${tx.currencyId || 'TRY'} for customer ${party.name}`);
          
          const paidSales = await manager.find(Sale, {
            where: [
              { partyId: party.id, status: 'approved' },
              { partyId: party.id, status: 'shipped' },
              { partyId: party.id, status: 'invoiced' }
            ],
            order: { createdAt: 'DESC' }
          });

          for (const sale of paidSales) {
            if (amountToRevert.lte(0)) break;

            const paidAmount = new Decimal(sale.paidAmount || 0);
            if (paidAmount.gt(0)) {
              const txExchangeRate = new Decimal(tx.exchangeRate || 1);
              const saleExchangeRate = new Decimal(sale.exchangeRate || 1);
              
              const amountToRevertInTl = amountToRevert.mul(txExchangeRate);
              const amountToRevertInSaleCurrency = amountToRevertInTl.div(saleExchangeRate);

              const revertInSaleCurrency = Decimal.min(paidAmount, amountToRevertInSaleCurrency);
              
              if (revertInSaleCurrency.gt(0)) {
                const newPaidAmount = paidAmount.sub(revertInSaleCurrency);
                sale.paidAmount = newPaidAmount;
                await manager.save(Sale, sale);

                console.log(`[FIFO Payment Cancel] Reverted ${revertInSaleCurrency} ${sale.currencyId} from Sale Code ${sale.code} (Remaining Paid: ${newPaidAmount})`);

                const revertInTxCurrency = revertInSaleCurrency.mul(saleExchangeRate).div(txExchangeRate);
                amountToRevert = amountToRevert.sub(revertInTxCurrency);
              }
            }
          }
        }
        // --- END REVERSE FIFO ALLOCATION ---

        // In-memory balance update
        const currentBalance = new Decimal(party.balance || 0);
        party.balance = isReverseCredit 
          ? currentBalance.sub(tlAmount) 
          : currentBalance.add(tlAmount);

        party.updatedBy = userId;
        await manager.save(Party, party);
      }
    }

    tx.status = 'cancelled';
    tx.updatedBy = userId;
    await manager.save(Transaction, tx);
    return { success: true, message: 'Muhasebe fişi ve cari hareketi geri alındı.' };
  }

  @Transactional()
  async transfer(dto: CreateTransferDto, userId: string): Promise<{ success: boolean; message: string }> {
    const manager = this.transactionContext.manager;

    const fromAccount = await manager.findOne(CommercialAccount, { where: { id: String(dto.fromAccountId) } });
    if (!fromAccount) throw new NotFoundException('Kaynak hesap bulunamadı');

    const toAccount = await manager.findOne(CommercialAccount, { where: { id: String(dto.toAccountId) } });
    if (!toAccount) throw new NotFoundException('Hedef hesap bulunamadı');

    const amountDecimal = new Decimal(dto.amount);
    if (amountDecimal.lte(0)) throw new BadRequestException('Transfer tutarı 0 veya daha küçük olamaz');

    const currencyId = dto.currencyId || fromAccount.currencyId;
    const currency = await manager.findOne(Currency, { where: { id: String(currencyId) } });
    if (!currency) throw new NotFoundException('Para birimi bulunamadı');

    const exchangeRate = new Decimal(currency.exchangeRate);
    const transferCode = await this.sequenceGenerator.generateTransactionCode(manager, 'TRNS');

    // Create Outgoing Transaction
    const outTx = this.txRepo.create({
      code: `${transferCode}-OUT`,
      commercialAccountId: fromAccount.id,
      amount: amountDecimal,
      currencyId: currency.id,
      exchangeRate,
      type: 'out',
      referenceType: 'transfer',
      referenceId: null,
      date: dto.date,
      description: dto.description || `${fromAccount.name} hesabından ${toAccount.name} hesabına transfer`,
      status: 'completed',
      createdBy: userId,
    });
    await manager.save(Transaction, outTx);

    // Create Incoming Transaction
    const inTx = this.txRepo.create({
      code: `${transferCode}-IN`,
      commercialAccountId: toAccount.id,
      amount: amountDecimal,
      currencyId: currency.id,
      exchangeRate,
      type: 'in',
      referenceType: 'transfer',
      referenceId: null,
      date: dto.date,
      description: dto.description || `${fromAccount.name} hesabından ${toAccount.name} hesabına transfer`,
      status: 'completed',
      createdBy: userId,
    });
    await manager.save(Transaction, inTx);

    return { success: true, message: 'Transfer başarıyla gerçekleştirildi.' };
  }

  async getStatus() {
    const firstDayOfMonth = dayjs().startOf('month').toDate();

    const stats = await this.txRepo.createQueryBuilder('tx')
      .select("SUM(CASE WHEN tx.type = 'in' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "income")
      .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "expense")
      .addSelect("COUNT(*)", "count")
      .where("tx.date >= :date", { date: DateUtils.getStartOfDay(firstDayOfMonth) })
      .andWhere("tx.status != 'cancelled'")
      .getRawOne();

    return {
      monthlyIncome: new Decimal(stats.income || 0).toString(),
      monthlyExpense: new Decimal(stats.expense || 0).toString(),
      count: Number(stats.count || 0),
      totalVolume: new Decimal(stats.income || 0).plus(new Decimal(stats.expense || 0)).toString(),
    };
  }

  async getDailyTrends() {
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    return await this.txRepo.createQueryBuilder('tx')
      .select("DATE(tx.date)", "day")
      .addSelect("SUM(CASE WHEN tx.type = 'in' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "income")
      .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "expense")
      .where("tx.date >= :date", { date: DateUtils.getStartOfDay(sevenDaysAgo) })
      .andWhere("tx.status != 'cancelled'")
      .groupBy("DATE(tx.date)")
      .orderBy("day", "ASC")
      .getRawMany();
  }
}