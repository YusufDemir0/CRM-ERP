import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommercialAccount } from './entities/commercial-account.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { CurrenciesService } from '../currencies/currencies.service';
import { AccountingLedger } from '../../parties/entities/ledger.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(CommercialAccount) private accRepo: Repository<CommercialAccount>,
    private dataSource: DataSource,
    private currenciesService: CurrenciesService,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<CommercialAccount>> {
    const qb = this.accRepo.createQueryBuilder('acc')
      .leftJoinAndSelect('acc.currency', 'currency');

    if (query.search) {
      const s = `%${query.search}%`;
      const cleanS = `%${query.search.replace(/[\s-]/g, '').replace(/^TR/i, '')}%`;
      qb.andWhere('(acc.name LIKE :s OR acc.bankName LIKE :s OR acc.description LIKE :s OR acc.iban LIKE :s OR REPLACE(REPLACE(acc.iban, " ", ""), "TR", "") LIKE :cleanS)', { s, cleanS });
    }

    const allowedSortCols = ['name', 'bankName', 'iban', 'criticalLimit', 'createdAt'];
    const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'name';
    qb.orderBy(`acc.${sortField}`, query.sortOrder || 'ASC');
    
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<CommercialAccount> {
    const acc = await this.accRepo.findOne({ where: { id }, relations: ['currency'] });
    if (!acc) throw new NotFoundException('Hesap bulunamadı');
    return acc;
  }

  async create(dto: CreateAccountDto, userId?: number): Promise<CommercialAccount> {
    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = Number(defaultCurrency.id);
      } catch (error) {
        console.warn('Default currency not found in AccountsService, setting to null');
      }
    }
    const acc = this.accRepo.create({ ...dto, createdBy: userId });
    return this.accRepo.save(acc);
  }

  async update(id: number, dto: UpdateAccountDto, userId?: number): Promise<CommercialAccount> {
    const acc = await this.findOne(id);
    if (dto.name !== undefined) acc.name = dto.name;
    if (dto.bankName !== undefined) acc.bankName = dto.bankName;
    if (dto.iban !== undefined) acc.iban = dto.iban;
    if (dto.ibanName !== undefined) acc.ibanName = dto.ibanName;
    if (dto.currencyId !== undefined) acc.currencyId = dto.currencyId;
    if (dto.criticalLimit !== undefined) acc.criticalLimit = dto.criticalLimit;
    if (dto.description !== undefined) acc.description = dto.description;
    if (dto.state !== undefined) acc.state = dto.state;

    acc.updatedBy = userId || null;
    return this.accRepo.save(acc);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.accRepo.softDelete(id);
  }

  async getStatus() {
    const [counts, balances] = await Promise.all([
      this.accRepo.createQueryBuilder('acc')
        .select("COUNT(*)", "total")
        .addSelect("SUM(CASE WHEN acc.state = 1 THEN 1 ELSE 0 END)", "active")
        .addSelect("SUM(CASE WHEN acc.state = 0 THEN 1 ELSE 0 END)", "passive")
        .getRawOne(),
      this.dataSource.getRepository(AccountingLedger).createQueryBuilder('al')
        .select("SUM(al.debit - al.credit)", "balance")
        .where("al.accountId IS NOT NULL")
        .getRawOne(),
    ]);

    return {
      active: Number(counts.active || 0),
      passive: Number(counts.passive || 0),
      total: Number(counts.total || 0),
      totalBalance: Number(balances.balance || 0),
    };
  }
}
