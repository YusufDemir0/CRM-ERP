import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transaction } from './entities/transaction.entity';
import { Party } from '../../parties/entities/party.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto } from '../dto/finance.dto';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { DateUtils } from '../../../common/utils/date.utils';
import { FinanceHelper as FH } from '../../../common/utils/finance.helper';
import dayjs from 'dayjs';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  async findAll(query: PaginationDto & { partyId?: number; type?: string; status?: string }): Promise<PaginatedResult<Transaction>> {
    const qb = this.txRepo.createQueryBuilder('tx')
      .leftJoinAndSelect('tx.party', 'party')
      .leftJoinAndSelect('tx.commercialAccount', 'account')
      .leftJoinAndSelect('tx.currency', 'currency');

    if (query.search) {
      qb.andWhere('(tx.code LIKE :s OR party.name LIKE :s OR tx.description LIKE :s OR account.name LIKE :s OR account.bankName LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.partyId) qb.andWhere('tx.partyId = :partyId', { partyId: query.partyId });
    if (query.type) qb.andWhere('tx.type = :type', { type: query.type });
    if (query.status) qb.andWhere('tx.status = :status', { status: query.status });

    // Security: Whitelist sort columns
    const allowedSortCols = ['date', 'amount', 'createdAt', 'code', 'party.name', 'account.name'];
    const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'date';
    
    const finalSortField = sortField.includes('.') ? sortField : `tx.${sortField}`;
    qb.orderBy(finalSortField, query.sortOrder || 'DESC');

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

  async findOne(id: number): Promise<Transaction> {
    const tx = await this.txRepo.findOne({
      where: { id },
      relations: ['party', 'commercialAccount', 'currency'],
    });
    if (!tx) throw new NotFoundException('İşlem bulunamadı');
    return tx;
  }

  async create(dto: CreateTransactionDto, userId?: number): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let party: Party | null = null;
      let exchangeRate = new Decimal(1);
      
      if (dto.partyId) {
        party = await queryRunner.manager.findOne(Party, { 
          where: { id: dto.partyId },
          lock: { mode: 'pessimistic_write' }
        });
        if (!party) throw new NotFoundException('Cari hesap bulunamadı');
      }

      const currency = await queryRunner.manager.findOne(Currency, { where: { id: dto.currencyId }});
      exchangeRate = currency ? new Decimal(currency.exchangeRate) : new Decimal(1);
      const tlAmount = FH.mul(dto.amount, exchangeRate);

      let newBalance: Decimal | null = null;
      if (party) {
        // BIZ-07: Context-aware balance calculation
        // Customer Pay-In = Credit (Sub), Supplier Refund-In = Debit (Add), Pay-Out (Anyone) = Debit (Add)
        const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
        const isDebit = dto.type === 'out' || isSupplierRefund;
        
        newBalance = isDebit 
          ? FH.add(new Decimal(party.balance), tlAmount) 
          : FH.sub(new Decimal(party.balance), tlAmount);

        // KREDİ LİMİTİ KONTROLÜ SADECE ÖDEMELER/ÇIKIŞLAR İÇİN (TEDİYE)
        if (dto.type === 'out' && party.creditLimit.gt(0) && newBalance.gt(party.creditLimit)) {
           throw new BadRequestException(`İşlem limit engeline takıldı. Yapılacak ödeme/harcama firmanın belirlediğiniz limitini aşıyor.`);
        }
      }

      const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
      const code = await this.sequenceGenerator.generateTransactionCode(queryRunner, prefix);

      const tx = queryRunner.manager.create(Transaction, {
        code, partyId: dto.partyId || undefined, commercialAccountId: dto.commercialAccountId,
        amount: new Decimal(dto.amount), currencyId: dto.currencyId || undefined, exchangeRate,
        type: dto.type, referenceType: dto.referenceType || undefined, referenceId: dto.referenceId || undefined,
        date: dto.date, description: dto.description || undefined, status: 'completed', createdBy: userId,
      });

      const savedTx = await queryRunner.manager.save(tx);
      
      if (party) {
        // Çift Taraflı Muhasebe:
        // Nakit girişi ('in') -> Hesaba alacak kaydı yazılır (credit) - ISTISNA: Tedarikçi İadesi Borçtur (debit)
        // Nakit çıkışı ('out') -> Hesaba borç kaydı yazılır (debit)
        const isSupplierRefund = dto.type === 'in' && party.type === 'provider';
        const isCredit = dto.type === 'in' && !isSupplierRefund;
        const entryDebit = isCredit ? new Decimal(0) : tlAmount;
        const entryCredit = isCredit ? tlAmount : new Decimal(0);
        await queryRunner.manager.save(queryRunner.manager.create(AccountingLedger, {
          date: DateUtils.getToday(),
          partyId: party.id,
          accountId: dto.commercialAccountId,
          debit: entryDebit,
          credit: entryCredit,
          transactionId: savedTx.id,
          source: dto.type === 'in' ? 'PAYMENT_IN' : 'PAYMENT_OUT',
          description: dto.description || `Kasa Fişi: ${code}`
        }));

        const sign = (dto.type === 'in' && !isSupplierRefund) ? '-' : '+';
        await queryRunner.manager.createQueryBuilder()
          .update(Party)
          .set({ balance: () => `balance ${sign} ${tlAmount.toString()}` })
          .where('id = :id', { id: party.id })
          .execute();
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedTx.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // TERS KAYIT (REVERT) - EVRAK İPTALİ (Cari bakiyeyi geri alır)
  async cancel(id: number, userId?: number): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tx = await queryRunner.manager.findOne(Transaction, { where: { id }});
      if (!tx || tx.status === 'cancelled') throw new BadRequestException('Sadece tamamlanmış aktif işlemler iptal edilebilir.');

      let newBalance: Decimal | null = null;
      if (tx.partyId) {
        const party = await queryRunner.manager.findOne(Party, { 
          where: { id: tx.partyId },
          lock: { mode: 'pessimistic_write' }
        });
        if (party) {
          const isSupplierRefund = tx.type === 'in' && party.type === 'provider';
          const isReverseCredit = (tx.type === 'in' && !isSupplierRefund) ? false : true;
          const tlAmount = FH.mul(tx.amount, tx.exchangeRate);
          
          const revDebit = isReverseCredit ? new Decimal(0) : tlAmount;
          const revCredit = isReverseCredit ? tlAmount : new Decimal(0);

          await queryRunner.manager.save(queryRunner.manager.create(AccountingLedger, {
            date: DateUtils.getToday(),
            partyId: party.id,
            accountId: tx.commercialAccountId,
            debit: revDebit,
            credit: revCredit,
            transactionId: tx.id,
            source: 'CANCEL',
            description: `İptal Fişi: ${tx.code}`
          }));

          const sign = (tx.type === 'in' && !isSupplierRefund) ? '+' : '-';
          await queryRunner.manager.createQueryBuilder()
            .update(Party)
            .set({ balance: () => `balance ${sign} ${tlAmount.toString()}` })
            .where('id = :id', { id: party.id })
            .execute();
        }
      }

      await queryRunner.manager.update(Transaction, tx.id, { status: 'cancelled', updatedBy: userId });

      await queryRunner.commitTransaction();
      return { success: true, message: 'Muhasebe fişi ve cari hareketi geri alındı.' };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
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
      monthlyIncome: stats.income?.toString() || '0',
      monthlyExpense: stats.expense?.toString() || '0',
      count: Number(stats.count || 0),
      // totalVolume calculation should be done with Decimal
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