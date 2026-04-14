import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transaction } from './entities/transaction.entity';
import { Party } from '../../parties/entities/party.entity';
import { Currency } from '../currencies/entities/currency.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto } from '../dto/finance.dto';
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

    if (query.search) qb.where('(tx.code LIKE :s OR party.name LIKE :s)', { s: `%${query.search}%` });
    if (query.partyId) qb.andWhere('tx.partyId = :partyId', { partyId: query.partyId });
    if (query.type) qb.andWhere('tx.type = :type', { type: query.type });
    if (query.status) qb.andWhere('tx.status = :status', { status: query.status });

    // Security: Whitelist sort columns
    const allowedSortCols = ['date', 'amount', 'createdAt', 'code'];
    const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'date';
    qb.orderBy(`tx.${sortCol}`, query.sortOrder || 'DESC');
    
    if (sortCol !== 'createdAt') {
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
      const party = await queryRunner.manager.findOne(Party, { 
        where: { id: dto.partyId },
        lock: { mode: 'pessimistic_write' }
      });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı');

      const currency = await queryRunner.manager.findOne(Currency, { where: { id: dto.currencyId }});
      const exchangeRate = currency ? currency.exchangeRate : new Decimal(1);
      const tlAmount = FH.mul(dto.amount, exchangeRate);

      // In = Tahsilat (Borçtan düşer/bakiye eksiye gider), Out = Ödeme (Bakiye artıya gider)
      const newBalance = dto.type === 'in' 
        ? FH.sub(party.balance, tlAmount) 
        : FH.add(party.balance, tlAmount);

      // KREDİ LİMİTİ KONTROLÜ SADECE ÖDEMELER/ÇIKIŞLAR İÇİN (TEDİYE)
      if (dto.type === 'out' && party.creditLimit.gt(0) && newBalance.gt(party.creditLimit)) {
         throw new BadRequestException(`İşlem limit engeline takıldı. Yapılacak ödeme/harcama firmanın belirlediğiniz limitini aşıyor.`);
      }

      const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
      const code = await this.sequenceGenerator.generateTransactionCode(queryRunner, prefix);

      const tx = queryRunner.manager.create(Transaction, {
        code, partyId: dto.partyId, commercialAccountId: dto.commercialAccountId,
        amount: new Decimal(dto.amount), currencyId: dto.currencyId || null, exchangeRate,
        type: dto.type, referenceType: dto.referenceType || null, referenceId: dto.referenceId || null,
        date: dto.date, description: dto.description || null, status: 'completed', createdBy: userId,
      });

      const savedTx = await queryRunner.manager.save(tx);
      await queryRunner.manager.update(Party, party.id, { balance: newBalance, updatedBy: userId });

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

      const party = await queryRunner.manager.findOne(Party, { 
        where: { id: tx.partyId },
        lock: { mode: 'pessimistic_write' }
      });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı, işlem iptal edilemez.');

      const tlAmount = FH.mul(tx.amount, tx.exchangeRate);

      // İptal/Ters işlem. In -> parayı cariye geri ekle (borç), Out -> paradan cariden düş (ödeme iptal)
      const newBalance = tx.type === 'in' ? FH.add(party.balance, tlAmount) : FH.sub(party.balance, tlAmount);

      await queryRunner.manager.update(Party, party.id, { balance: newBalance, updatedBy: userId });
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
      .where("tx.date >= :date", { date: DateUtils.formatDate(firstDayOfMonth) })
      .andWhere("tx.status != 'cancelled'")
      .getRawOne();

    return {
      monthlyIncome: Number(stats.income || 0),
      monthlyExpense: Number(stats.expense || 0),
      count: Number(stats.count || 0),
      totalVolume: Number(stats.income || 0) + Number(stats.expense || 0),
    };
  }

  async getDailyTrends() {
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    return await this.txRepo.createQueryBuilder('tx')
      .select("DATE(tx.date)", "day")
      .addSelect("SUM(CASE WHEN tx.type = 'in' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "income")
      .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount * tx.exchangeRate ELSE 0 END)", "expense")
      .where("tx.date >= :date", { date: DateUtils.formatDate(sevenDaysAgo) })
      .andWhere("tx.status != 'cancelled'")
      .groupBy("DATE(tx.date)")
      .orderBy("day", "ASC")
      .getRawMany();
  }
}