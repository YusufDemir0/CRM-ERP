import * as crypto from 'crypto';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Party } from './entities/party.entity';
import { CreatePartyDto, UpdatePartyDto, PartiesQueryDto, MovementsQueryDto, StatementEntry, MovementRow } from './dto/party.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CurrenciesService } from '../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';

import { getSafeSearchPattern } from '../../common/utils/sql.helper';
import { Sale } from '../sales/entities/sale.entity';
import { AccountingLedger } from './entities/ledger.entity';
import { Shipment } from '../inventory/stocks/entities/shipment.entity';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(Party)
    private partyRepo: Repository<Party>,
    private currenciesService: CurrenciesService,
  ) { }
  
  async lookup(type?: string, currentUser?: JwtPayload): Promise<Partial<Party>[]> {
    const qb = this.partyRepo.createQueryBuilder('party')
      .select([
        'party.id', 'party.name', 'party.type', 'party.currencyId',
        'party.phone1', 'party.phone2', 'party.email', 'party.taxNumber',
        'party.address', 'party.cityId', 'party.districtName', 'party.maturityDays'
      ])
      .where('party.state = :state', { state: 1 });

    const hasViewAll = currentUser?.isSystemAdmin || 
                       currentUser?.permissions?.includes('PARTIES_VIEW_ALL') || 
                       currentUser?.permissions?.includes('parties_view_all') ||
                       currentUser?.permissions?.includes('PARTIES_USE_SELECTION') ||
                       currentUser?.permissions?.includes('parties_use_selection') ||
                       currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
                       currentUser?.permissions?.includes('sales_view_all') ||
                       currentUser?.permissions?.includes('SALES_EDIT_ALL') ||
                       currentUser?.permissions?.includes('sales_edit_all');
    if (!hasViewAll) {
      const hasViewDept = currentUser?.permissions?.includes('PARTIES_VIEW_DEPT') || 
                          currentUser?.permissions?.includes('parties_view_dept') ||
                          currentUser?.permissions?.includes('SALES_VIEW_DEPT') ||
                          currentUser?.permissions?.includes('sales_view_dept');
      if (hasViewDept && currentUser?.departmentId) {
        qb.andWhere('party.departmentId = :userDeptId', { userDeptId: String(currentUser.departmentId) });
      } else {
        qb.andWhere('party.createdBy = :userId', { userId: String(currentUser?.sub) });
      }
    }

    if (type) {
      qb.andWhere('party.type = :type', { type });
    }

    return qb.orderBy('party.id', 'DESC').getMany();
  }

  async findAll(query: PartiesQueryDto, currentUser?: JwtPayload): Promise<PaginatedResult<Party>> {
    const qb = this.partyRepo.createQueryBuilder('party')
      .select([
        'party.id', 'party.name', 'party.type', 'party.state', 
        'party.taxNumber', 'party.taxOffice', 'party.phone1', 'party.phone2', 
        'party.email', 'party.balance', 'party.address', 'party.cityId',
        'party.districtName', 'party.creditLimit', 'party.currencyId', 'party.notes', 'party.maturityDays',
        'party.createdAt'
      ])
      .leftJoin('party.currency', 'currency')
      .addSelect(['currency.id', 'currency.symbol', 'currency.code']);

    const hasViewAll = currentUser?.isSystemAdmin || 
                       currentUser?.permissions?.includes('PARTIES_VIEW_ALL') || 
                       currentUser?.permissions?.includes('parties_view_all');
    if (query.isMovements === 'true') {
      if (!hasViewAll) {
        qb.andWhere('party.createdBy = :userId', { userId: String(currentUser?.sub) });
      }
    } else {
      if (!hasViewAll) {
        const hasViewDept = currentUser?.permissions?.includes('PARTIES_VIEW_DEPT') || currentUser?.permissions?.includes('parties_view_dept');
        if (hasViewDept && currentUser?.departmentId) {
          qb.andWhere('party.departmentId = :userDeptId', { userDeptId: String(currentUser.departmentId) });
        } else {
          qb.andWhere('party.createdBy = :userId', { userId: String(currentUser?.sub) });
        }
      } else if (query.departmentId) {
        qb.innerJoin('users', 'u', 'u.id = party.created_by AND u.department_id = :departmentId', { departmentId: query.departmentId });
      }
    }

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      if (s) {
        qb.andWhere(
          '(party.name LIKE :s OR party.phone1 LIKE :s OR party.phone2 LIKE :s OR party.taxOffice LIKE :s OR party.taxNumber LIKE :s OR party.email LIKE :s OR party.address LIKE :s OR party.districtName LIKE :s OR party.notes LIKE :s)',
          { s }
        );
      }
    }

    // DB-04: Dynamic Advanced Filters (Sidebar filters) with Map-based whitelist
    const partyFilterMap: Record<string, string> = {
      name: 'party.name',
      phone1: 'party.phone1',
      email: 'party.email',
      taxNumber: 'party.taxNumber',
      taxOffice: 'party.taxOffice',
      cityId: 'party.cityId',
      districtName: 'party.districtName',
    };

    Object.keys(query).forEach(key => {
      const dbCol = partyFilterMap[key];
      const val = query[key as keyof typeof query];
      if (dbCol && val !== undefined) {
        const searchPattern = getSafeSearchPattern(val.toString());
        if (searchPattern) {
          qb.andWhere(`${dbCol} LIKE :${key}`, { [key]: searchPattern });
        }
      }
    });

    if (query.type) {
      const types = query.type.split(',');
      if (types.length > 1) {
        qb.andWhere('party.type IN (:...types)', { types });
      } else {
        qb.andWhere('party.type = :type', { type: query.type });
      }
    }

    if (query.state !== undefined) {
      qb.andWhere('party.state = :state', { state: query.state });
    }

    // Security: Whitelist sort columns
    const allowedSortCols = ['name', 'balance', 'creditLimit', 'id', 'createdAt', 'taxNumber', 'phone1'];
    const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'id';
    const sortOrder = query.sortBy ? query.sortOrderSafe : 'DESC';
    qb.orderBy(`party.${sortCol}`, sortOrder);

    qb.skip(query.skip).take(query.limit);

    // Add subqueries for the stats
    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(sale.id)')
        .from('sales', 'sale')
        .where('sale.party_id = party.id')
        .andWhere('sale.deleted_at IS NULL');
    }, 'total_sales_count');

    qb.addSelect((subQuery) => {
      return subQuery
        .select('MAX(sale.created_at)')
        .from('sales', 'sale')
        .where('sale.party_id = party.id')
        .andWhere('sale.deleted_at IS NULL');
    }, 'last_sale_date');

    qb.addSelect((subQuery) => {
      return subQuery
        .select('COALESCE(SUM(sale.grand_total - sale.paid_amount), 0)')
        .from('sales', 'sale')
        .where('sale.party_id = party.id')
        .andWhere("sale.status != 'cancelled'")
        .andWhere('sale.deleted_at IS NULL');
    }, 'total_remaining_balance');

    const { entities, raw } = await qb.getRawAndEntities();
    const count = await qb.getCount();

    // SEC-02: Optimized O(N) mapping using a Map for raw data lookups
    const rawMap = new Map(raw.map(r => [r.party_id.toString(), r]));
    
    entities.forEach(entity => {
      const rawData = rawMap.get(entity.id.toString());
      if (rawData) {
        entity.totalSalesCount = Number(rawData.total_sales_count || 0);
        entity.lastSaleDate = rawData.last_sale_date || null;
        
        // Calculate remaining balance dynamically matching totalRemaining
        const remainingVal = new Decimal(rawData.total_remaining_balance || 0);
        entity.balance = remainingVal;
        entity.calculatedBalance = remainingVal;
      }
    });

    return {
      data: entities,
      meta: { total: count, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(count / (query.limit || 20)) },
    };
  }


  async findOne(id: string): Promise<Party> {
    const party = await this.partyRepo.findOne({ where: { id: String(id) }, relations: ['currency'] });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');

    // Calculate remaining balance dynamically matching totalRemaining
    const remaining = await this.partyRepo.manager.createQueryBuilder()
      .select('COALESCE(SUM(sale.grand_total - sale.paid_amount), 0)', 'total')
      .from('sales', 'sale')
      .where('sale.party_id = :id', { id })
      .andWhere("sale.status != 'cancelled'")
      .andWhere('sale.deleted_at IS NULL')
      .getRawOne();

    party.balance = new Decimal(remaining?.total || 0);
    return party;
  }

  async create(dto: CreatePartyDto, userId: string): Promise<Party> {
    if (dto.taxNumber) {
      const existing = await this.partyRepo.findOne({
        where: { taxNumber: dto.taxNumber },
        withDeleted: true
      });
      if (existing) {
        throw new BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (ID: ${existing.id}, İsim: ${existing.name}).`);
      }
    }

    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = String(defaultCurrency.id);
      } catch (error) {
        console.warn('Default currency not found, setting to null');
      }
    }
    let departmentId = dto.departmentId;
    if (!departmentId && userId) {
      const user = await this.partyRepo.manager.query(
        "SELECT department_id FROM users WHERE id = ? LIMIT 1",
        [userId]
      );
      if (user && user.length > 0 && user[0].department_id) {
        departmentId = String(user[0].department_id);
      }
    }
    const party = this.partyRepo.create({ ...dto, balance: new Decimal(0), createdBy: userId, departmentId });
    return this.partyRepo.save(party);
  }

  async update(id: string, dto: UpdatePartyDto, userId: string, currentUser?: JwtPayload): Promise<Party> {
    const party = await this.findOne(id);

    // Ownership check for PARTIES_EDIT_OWN
    if (currentUser && !currentUser.isSystemAdmin && !currentUser.permissions?.includes('PARTIES_EDIT_ALL')) {
      if (party.createdBy !== String(currentUser.sub)) {
        throw new ForbiddenException('Sadece kendi oluşturduğunuz cari hesapları düzenleyebilirsiniz.');
      }
    }

    // DB-05: Uniqueness Check
    if (dto.taxNumber && dto.taxNumber !== party.taxNumber) {
      const existing = await this.partyRepo.findOne({ where: { taxNumber: dto.taxNumber } });
      if (existing && existing.id !== String(id)) {
        throw new BadRequestException(`'${dto.taxNumber}' vergi numarası ile başka bir cari mevcut (${existing.name}).`);
      }
    }

    // Modernize mapping with strict field control
    const fields: (keyof Party)[] = [
      'name', 'type', 'phone1', 'phone2', 'taxOffice', 'taxNumber', 'email',
      'address', 'cityId', 'districtName', 'paymentTerms', 'currencyId', 'notes', 'state', 'departmentId', 'maturityDays'
    ];

    fields.forEach((field) => {
      const dtoValue = dto[field as keyof UpdatePartyDto];
      if (dtoValue !== undefined) {
        // DB-04: Pasife alma kontrolü
        if (field === 'state' && dtoValue === 0 && !new Decimal(party.balance).isZero()) {
          throw new BadRequestException(
            `Bakiyesi olan cari hesaplar pasife alınamaz. Mevcut Bakiye: ${party.balance.toString()}. ` +
            `Lütfen önce finansal hesabı sıfırlayınız.`
          );
        }

        (party as unknown as Record<string, unknown>)[field] = dtoValue;
      }
    });

    // Explicit Decimal fields
    if (dto.creditLimit !== undefined) {
      party.creditLimit = new Decimal(dto.creditLimit);
    }

    party.updatedBy = userId || null;
    return this.partyRepo.save(party);
  }

  async softDelete(id: string): Promise<void> {
    const party = await this.findOne(id);

    // DB-04: Bakiye varsa silmeyi engelle
    if (!new Decimal(party.balance).isZero()) {
      throw new BadRequestException(
        `Bakiyesi olan cari hesaplar silinemez. Mevcut Bakiye: ${party.balance.toString()}. ` +
        `Lütfen önce finansal hesabı sıfırlayınız (Tahsilat/Ödeme).`
      );
    }

    // SEC-05: Aktif Sipariş Kontrolü
    const activeSales = await this.partyRepo.manager.getRepository(Sale).count({
      where: { partyId: id, status: In(['draft', 'approved', 'shipped']) }
    });

    if (activeSales > 0) {
      throw new BadRequestException(
        `Bu cari hesaba ait ${activeSales} adet aktif satış/sipariş bulunmaktadır. ` +
        `Önce bunları iptal etmeli veya tamamlamalısınız.`
      );
    }

    // Unique alanları UUID ile damgala — substring kırpma çakışması riski sıfır
    const suffix = `_del_${crypto.randomUUID().substring(0, 8)}`;
    await this.partyRepo.update(id, {
      taxNumber: `${party.taxNumber || id}${suffix}`.substring(0, 50),
      state: 0,
    });
    await this.partyRepo.softDelete(id);
  }


  async getBalance(id: string) {
    const party = await this.findOne(id);
    return {
      balance: new Decimal(party.balance || 0).toFixed(2),
      creditLimit: new Decimal(party.creditLimit || 0).toFixed(2),
      currency: party.currency?.code || 'TRY',
      symbol: party.currency?.symbol || '₺'
    };
  }

  // ────── V2 REFINEMENTS ──────

  async getStatus() {
    const stats = await this.partyRepo.createQueryBuilder('party')
      .leftJoin('party.currency', 'currency')
      .select([
        "COUNT(CASE WHEN party.state = 1 THEN 1 END) as active",
        "COUNT(CASE WHEN party.state = 0 THEN 1 END) as passive",
        "SUM(party.balance * COALESCE(currency.exchangeRate, 1)) as total_receivable",
        "SUM(party.creditLimit * COALESCE(currency.exchangeRate, 1)) as total_credit_limit"
      ])
      .getRawOne();

    const atRiskCount = await this.partyRepo.createQueryBuilder('party')
      .leftJoin('party.currency', 'currency')
      .where('party.state = 1')
      .andWhere('party.credit_limit > 0')
      .andWhere('ABS(party.balance * COALESCE(currency.exchangeRate, 1)) >= (party.credit_limit * COALESCE(currency.exchangeRate, 1) * 0.9)')
      .getCount();

    const totalReceivable = new Decimal(stats.total_receivable || 0);
    const totalCreditLimit = new Decimal(stats.total_credit_limit || 0);

    return {
      active: Number(stats.active || 0),
      passive: Number(stats.passive || 0),
      totalReceivable: totalReceivable.toFixed(2),
      exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toDecimalPlaces(0).toNumber() : 0,
      atRiskCount
    };
  }

  async getGlobalExposure() {
    const stats = await this.partyRepo.createQueryBuilder('party')
      .leftJoin('party.currency', 'currency')
      .select([
        "SUM(party.balance * COALESCE(currency.exchangeRate, 1)) as total_receivable",
        "SUM(party.creditLimit * COALESCE(currency.exchangeRate, 1)) as total_credit_limit"
      ])
      .getRawOne();

    const totalReceivable = new Decimal(stats.total_receivable || 0);
    const totalCreditLimit = new Decimal(stats.total_credit_limit || 0);

    return {
      totalReceivable: totalReceivable.toFixed(2),
      totalCreditLimit: totalCreditLimit.toFixed(2),
      exposurePercentage: totalCreditLimit.gt(0) ? totalReceivable.div(totalCreditLimit).mul(100).toDecimalPlaces(2).toNumber() : 0
    };
  }

  async getHealthMetrics() {
    const allCount = await this.partyRepo.count({ where: { state: 1 } });
    
    const atRisk = await this.partyRepo.createQueryBuilder('party')
      .leftJoin('party.currency', 'currency')
      .select(['party.id', 'party.name', 'party.balance', 'party.creditLimit'])
      .where('party.state = 1')
      .andWhere('party.credit_limit > 0')
      .andWhere('(party.balance * COALESCE(currency.exchangeRate, 1)) >= (party.credit_limit * COALESCE(currency.exchangeRate, 1) * 0.9)')
      .getMany();

    return {
      healthyCount: allCount - atRisk.length,
      atRiskCount: atRisk.length,
      requiresAttention: atRisk.map(p => ({ id: p.id, name: p.name, balance: p.balance, limit: p.creditLimit }))
    };
  }

  async getStatement(id: string): Promise<StatementEntry[]> {
    const party = await this.findOne(id);

    const ledgerEntries = await this.partyRepo.manager.getRepository(AccountingLedger).find({
      where: { partyId: String(id) },
      order: { date: 'ASC', createdAt: 'ASC' }
    });

    const shipments = await this.partyRepo.manager.getRepository(Shipment).createQueryBuilder('shipment')
      .innerJoinAndSelect('shipment.sale', 'sale')
      .where('sale.partyId = :partyId', { partyId: String(id) })
      .orderBy('shipment.createdAt', 'ASC')
      .getMany();

    const items: StatementEntry[] = [];

    // Map ledger entries
    for (const entry of ledgerEntries) {
      items.push({
        id: `ledger_${entry.id}`,
        date: entry.date,
        createdAt: entry.createdAt,
        type: entry.source, // 'SALE', 'DEPOSIT', 'PAYMENT_IN', 'PAYMENT_OUT', etc.
        code: entry.source === 'SALE' || entry.source === 'CANCEL_SALE' || entry.source === 'DEPOSIT' || entry.source === 'CANCEL_DEPOSIT' ? 'SİPARİŞ' : 'İŞLEM',
        description: entry.description,
        debit: Number(entry.debit || 0),
        credit: Number(entry.credit || 0),
        transactionId: entry.transactionId,
      });
    }

    // Map shipments
    for (const sh of shipments) {
      items.push({
        id: `shipment_${sh.id}`,
        date: sh.createdAt.toISOString().split('T')[0],
        createdAt: sh.createdAt,
        type: 'SHIPMENT',
        code: 'SEVKİYAT',
        description: `${sh.sale.code} nolu Sipariş için Sevkiyat (Durum: ${
          sh.status === 'completed' ? 'TAMAMLANDI' : 
          sh.status === 'shipped' ? 'YOLDA' : 
          sh.status === 'cancelled' ? 'İPTAL EDİLDİ' : 'BEKLİYOR'
        })`,
        debit: 0,
        credit: 0,
        transactionId: sh.saleId,
      });
    }

    // Sort chronologically by date first, then createdAt
    items.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Compute running balance
    let runningBalance = 0;
    const ledgerItems = items.map(item => {
      runningBalance = runningBalance + item.debit - item.credit;
      return {
        ...item,
        balance: runningBalance
      };
    });

    return ledgerItems;
  }

  async findAllMovements(query: MovementsQueryDto, currentUser: JwtPayload): Promise<PaginatedResult<MovementRow>> {
    const limit = Number(query.limit) || 20;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const qb = this.partyRepo.manager.getRepository(AccountingLedger).createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.party', 'party')
      .leftJoinAndSelect('ledger.account', 'account')
      .leftJoin('party.currency', 'currency')
      .addSelect(['currency.id', 'currency.symbol', 'currency.code']);

    // Perm check
    const hasViewAll = currentUser?.isSystemAdmin || 
                       currentUser?.permissions?.includes('PARTIES_VIEW_ALL') || 
                       currentUser?.permissions?.includes('parties_view_all');
    if (!hasViewAll) {
      qb.andWhere('party.createdBy = :userId', { userId: String(currentUser?.sub) });
    }

    if (query.partyId) {
      qb.andWhere('ledger.partyId = :partyId', { partyId: String(query.partyId) });
    }

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(party.name LIKE :s OR ledger.description LIKE :s OR ledger.source LIKE :s)', { s });
    }

    qb.orderBy('ledger.date', 'DESC')
      .addOrderBy('ledger.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map(item => ({
        id: item.id,
        date: item.date,
        partyName: item.party?.name,
        partyType: item.party?.type,
        partyId: item.partyId,
        source: item.source,
        description: item.description,
        debit: Number(item.debit || 0),
        credit: Number(item.credit || 0),
        currency: item.party?.currency?.symbol || '₺',
        transactionId: item.transactionId
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
