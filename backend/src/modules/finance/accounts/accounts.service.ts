import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommercialAccount } from './entities/commercial-account.entity';
import { Decimal } from 'decimal.js';
import { CreateAccountDto, UpdateAccountDto, AccountsQueryDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { CurrenciesService } from '../currencies/currencies.service';
import { AccountingLedger } from '../../parties/entities/ledger.entity';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';
import { Department } from '../../departments/entities/department.entity';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(CommercialAccount) private accRepo: Repository<CommercialAccount>,
    private dataSource: DataSource,
    private currenciesService: CurrenciesService,
  ) {}

  async findAll(query: AccountsQueryDto & { ignorePermissionRestrictions?: string | boolean }, currentUser?: JwtPayload): Promise<PaginatedResult<CommercialAccount>> {
    const qb = this.accRepo.createQueryBuilder('acc')
      .select([
        'acc.id', 'acc.name', 'acc.bankName', 'acc.iban', 'acc.ibanName',
        'acc.currencyId', 'acc.criticalLimit', 'acc.description',
        'acc.state', 'acc.createdAt'
      ])
      .leftJoin('acc.currency', 'currency')
      .addSelect(['currency.id', 'currency.symbol', 'currency.code'])
      .addSelect((subQuery) => {
        return subQuery
          .select("COALESCE(SUM(CASE WHEN tx.type = 'in' THEN tx.amount ELSE -tx.amount END), 0)")
          .from('transactions', 'tx')
          .where('tx.commercial_account_id = acc.id')
          .andWhere("tx.status != 'cancelled'")
          .andWhere('tx.deleted_at IS NULL');
      }, 'acc_balance');

    let hasViewAll = false;
    if (currentUser?.isSystemAdmin) {
      hasViewAll = true;
    } else if (String(query.ignorePermissionRestrictions) === 'true') {
      hasViewAll = !!(currentUser?.permissions?.includes('FINANCE_SELECT_ALL_CASH') ||
                       currentUser?.permissions?.includes('finance_select_all_cash') ||
                       currentUser?.permissions?.includes('FINANCE_USE_SELECTION') ||
                       currentUser?.permissions?.includes('finance_use_selection') ||
                       currentUser?.permissions?.includes('FINANCE_VIEW_ALL') ||
                       currentUser?.permissions?.includes('finance_view_all') ||
                       currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
                       currentUser?.permissions?.includes('sales_view_all') ||
                       currentUser?.permissions?.includes('SALES_EDIT_ALL') ||
                       currentUser?.permissions?.includes('sales_edit_all'));
    } else {
      hasViewAll = !!(currentUser?.permissions?.includes('FINANCE_VIEW_ALL') ||
                       currentUser?.permissions?.includes('finance_view_all'));
    }

    if (!hasViewAll) {
      if (currentUser?.departmentId) {
        const department = await this.dataSource.getRepository(Department).findOne({
          where: { id: String(currentUser.departmentId) }
        });
        if (department && department.commercialAccountId) {
          qb.andWhere('acc.id = :deptAccountId', { deptAccountId: String(department.commercialAccountId) });
        } else {
          qb.andWhere('1 = 0');
        }
      } else {
        qb.andWhere('1 = 0');
      }
    }

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      const cleanTerm = query.search.replace(/[\s-]/g, '').replace(/^TR/i, '');
      const cleanS = getSafeSearchPattern(cleanTerm);
      qb.andWhere('(acc.name LIKE :s OR acc.bankName LIKE :s OR acc.ibanName LIKE :s OR acc.description LIKE :s OR acc.iban LIKE :s OR REPLACE(REPLACE(acc.iban, " ", ""), "TR", "") LIKE :cleanS)', { s, cleanS });
    }

    if (query.state !== undefined) {
      qb.andWhere('acc.state = :state', { state: query.state });
    }

    const allowedSortCols = ['name', 'bankName', 'iban', 'criticalLimit', 'createdAt'];
    const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'name';
    qb.orderBy(`acc.${sortField}`, query.sortOrderSafe);
    
    qb.skip(query.skip).take(query.limit);
    const { entities, raw } = await qb.getRawAndEntities();
    const count = await qb.getCount();

    const rawMap = new Map(raw.map(r => [r.acc_id.toString(), r]));
    entities.forEach(entity => {
       const rawData = rawMap.get(entity.id.toString());
       if (rawData) {
        entity.balance = new Decimal(rawData.acc_balance || 0).toFixed(2);
       } else {
        entity.balance = '0.00';
       }
    });

    return {
      data: entities,
      meta: { total: count, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(count / (query.limit || 20)) },
    };
  }

  async findOne(id: string): Promise<CommercialAccount> {
    const acc = await this.accRepo.findOne({ where: { id: String(id) }, relations: ['currency'] });
    if (!acc) throw new NotFoundException('Hesap bulunamadı');

    const balanceRaw = await this.accRepo.manager.createQueryBuilder()
      .select("COALESCE(SUM(CASE WHEN tx.type = 'in' THEN tx.amount ELSE -tx.amount END), 0)", 'balance')
      .from('transactions', 'tx')
      .where('tx.commercial_account_id = :id', { id })
      .andWhere("tx.status != 'cancelled'")
      .andWhere('tx.deleted_at IS NULL')
      .getRawOne();
      
    acc.balance = new Decimal(balanceRaw?.balance || 0).toFixed(2);
    return acc;
  }

  async create(dto: CreateAccountDto, userId: string): Promise<CommercialAccount> {
    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = String(defaultCurrency.id);
      } catch (error) {
        console.warn('Default currency not found in AccountsService, setting to null');
      }
    }
    const acc = this.accRepo.create({ 
      ...dto, 
      criticalLimit: dto.criticalLimit !== undefined ? new Decimal(dto.criticalLimit) : undefined,
      createdBy: userId 
    });
    return this.accRepo.save(acc);
  }

  async update(id: string, dto: UpdateAccountDto, userId: string): Promise<CommercialAccount> {
    const acc = await this.findOne(id);
    if (dto.name !== undefined) acc.name = dto.name;
    if (dto.bankName !== undefined) acc.bankName = dto.bankName;
    if (dto.iban !== undefined) acc.iban = dto.iban;
    if (dto.ibanName !== undefined) acc.ibanName = dto.ibanName;
    if (dto.currencyId !== undefined) acc.currencyId = dto.currencyId;
    if (dto.criticalLimit !== undefined) acc.criticalLimit = new Decimal(dto.criticalLimit);
    if (dto.description !== undefined) acc.description = dto.description;
    if (dto.state !== undefined) acc.state = dto.state;

    acc.updatedBy = userId || null;
    return this.accRepo.save(acc);
  }

  async softDelete(id: string): Promise<void> {
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
      totalBalance: new Decimal(balances.balance || 0).toFixed(2),
    };
  }
}
