import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Party } from '../../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Party) private partyRepo: Repository<Party>,
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

    qb.orderBy('tx.date', 'DESC').addOrderBy('tx.createdAt', 'DESC');
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

  /**
   * Yeni finansal işlem (Tahsilat/Tediye) — Transaction içinde
   * 1. Otomatik kod üretimi (pessimistic lock)
   * 2. Cari bakiye güncelleme
   */
  async create(dto: CreateTransactionDto, userId?: number): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Prefix: Tahsilat = MKB, Tediye = TDY
      const prefix = dto.type === 'in' ? 'MKB' : 'TDY';
      const code = await this.sequenceGenerator.generateTransactionCode(queryRunner, prefix);

      // İşlem oluştur
      const tx = queryRunner.manager.create(Transaction, {
        code,
        partyId: dto.partyId,
        commercialAccountId: dto.commercialAccountId,
        amount: dto.amount,
        currencyId: dto.currencyId || null,
        type: dto.type,
        referenceType: dto.referenceType || null,
        referenceId: dto.referenceId || null,
        date: dto.date,
        description: dto.description || null,
        status: 'completed' as const,
        createdBy: userId,
      });

      const savedTx = await queryRunner.manager.save(tx);

      // Cari bakiye güncelle
      const party = await queryRunner.manager.findOne(Party, { where: { id: dto.partyId } });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı');

      const currentBalance = Number(party.balance);
      // Tahsilat (in) → bakiye azalır (müşteri borcunu ödüyor)
      // Tediye (out) → bakiye artar (biz borç alıyoruz / ödeme yapıyoruz)
      const newBalance = dto.type === 'in'
        ? currentBalance - dto.amount
        : currentBalance + dto.amount;

      await queryRunner.manager.update(Party, party.id, {
        balance: newBalance,
        updatedBy: userId,
      });

      await queryRunner.commitTransaction();
      return this.findOne(savedTx.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStatus() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const stats = await this.txRepo.createQueryBuilder('tx')
      .select("SUM(CASE WHEN tx.type = 'in' THEN tx.amount ELSE 0 END)", "income")
      .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount ELSE 0 END)", "expense")
      .addSelect("COUNT(*)", "count")
      .where("tx.date >= :date", { date: firstDayOfMonth.toISOString().split('T')[0] })
      .getRawOne();

    return {
      monthlyIncome: Number(stats.income || 0),
      monthlyExpense: Number(stats.expense || 0),
      count: Number(stats.count || 0),
      totalVolume: Number(stats.income || 0) + Number(stats.expense || 0),
    };
  }

  async getDailyTrends() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const results = await this.txRepo.createQueryBuilder('tx')
      .select("DATE(tx.date)", "day")
      .addSelect("SUM(CASE WHEN tx.type = 'in' THEN tx.amount ELSE 0 END)", "income")
      .addSelect("SUM(CASE WHEN tx.type = 'out' THEN tx.amount ELSE 0 END)", "expense")
      .where("tx.date >= :date", { date: sevenDaysAgo.toISOString().split('T')[0] })
      .groupBy("DATE(tx.date)")
      .orderBy("day", "ASC")
      .getRawMany();

    return results;
  }
}
