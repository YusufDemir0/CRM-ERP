import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import * as ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';

import { Sale } from './entities/sale.entity';
import { SaleType } from './entities/sale-type.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { SalesQueryDto } from './dto/sale.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';
import { DateUtils } from '../../common/utils/date.utils';
import { ItemData } from './domain/sale-calculator';

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleType) private saleTypeRepo: Repository<SaleType>,
  ) {}

  async findAllSaleTypes(): Promise<SaleType[]> {
    return this.saleTypeRepo.find();
  }

  async findMinimalLookup(user?: JwtPayload): Promise<any[]> {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .leftJoin('sale.party', 'party')
      .select([
        'sale.id',
        'sale.code',
        'sale.grandTotal',
        'sale.phone',
        'party.id',
        'party.name',
        'party.phone1'
      ]);

    if (user && !user.isSystemAdmin) {
      if (user.permissions?.includes('SALES_VIEW_ALL') || user.permissions?.includes('SALES_MASTER_VIEW') || user.permissions?.includes('sales_view_all') || user.permissions?.includes('sales_master_view')) {
        // Full access
      } else if (user.permissions?.includes('SALES_VIEW_DEPT') || user.permissions?.includes('sales_view_dept')) {
        if (user.departmentId) {
          qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
        } else {
          qb.andWhere('1 = 0');
        }
      } else {
        // Default to SALES_VIEW_OWN
        qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
      }
    }

    return qb.orderBy('sale.createdAt', 'DESC')
      .limit(1000)
      .getMany();
  }

  async findAll(query: SalesQueryDto, user?: JwtPayload): Promise<PaginatedResult<Sale>> {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .select([
        'sale.id', 'sale.code', 'sale.status', 'sale.totalAmount', 'sale.grandTotal',
        'sale.kdv', 'sale.discountAmount', 'sale.createdAt', 'sale.updatedAt',
        'sale.deliveryDate', 'sale.phone', 'sale.address', 'sale.profit',
        'sale.maturityDays', 'sale.paymentType', 'sale.installments', 'sale.paidAmount',
        'sale.commercialAccountId', 'sale.city', 'sale.district', 'sale.notes', 'sale.email',
        'sale.source', 'sale.deposit'
      ])
      .leftJoin('sale.party', 'party')
      .addSelect(['party.id', 'party.name', 'party.type', 'party.balance', 'party.creditLimit'])
      .leftJoin('sale.saleType', 'saleType')
      .addSelect(['saleType.id', 'saleType.name', 'saleType.abbreviation'])
      .leftJoin('sale.currency', 'currency')
      .addSelect(['currency.id', 'currency.symbol', 'currency.code'])
      .leftJoin('sale.department', 'department')
      .addSelect(['department.id', 'department.name', 'department.abbreviation'])
      .leftJoin('sale.commercialAccount', 'commercialAccount')
      .addSelect(['commercialAccount.id', 'commercialAccount.name', 'commercialAccount.bankName']);

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      if (s) {
        qb.andWhere(
          '(sale.code LIKE :s OR sale.notes LIKE :s OR sale.phone LIKE :s OR sale.address LIKE :s OR sale.city LIKE :s OR sale.district LIKE :s OR sale.taxNumber LIKE :s OR sale.email LIKE :s OR sale.source LIKE :s OR party.name LIKE :s)',
          { s }
        );
      }
    }
    if (query.status) qb.andWhere('sale.status = :status', { status: query.status });
    if (query.partyId) qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });
    if (query.departmentId) qb.andWhere('sale.departmentId = :departmentId', { departmentId: query.departmentId });

    if (user && !user.isSystemAdmin) {
      const forceOwnSales = query.ownSalesOnly === 'true' || query.ownSalesOnly === true;
      if (forceOwnSales) {
        qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
      } else if (user.permissions?.includes('SALES_VIEW_ALL')) {
        // SALES_VIEW_ALL sees all sales across the company. No department constraint.
      } else if (user.permissions?.includes('PARTIES_VIEW_SALES_HISTORY') && query.partyId) {
        // Allow seeing all sales of this specific party if they have history view permission
      } else if (user.permissions?.includes('SALES_VIEW_DEPT')) {
        if (user.departmentId) {
          qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
        } else {
          qb.andWhere('1 = 0');
        }
      } else {
        // Default to SALES_VIEW_OWN
        qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
      }
    }
    
    const allowedSortMap: Record<string, string> = {
      'code': 'sale.code',
      'createdAt': 'sale.createdAt',
      'grandTotal': 'sale.grandTotal',
      'status': 'sale.status',
      'party.name': 'party.name',
      'saleType.name': 'saleType.name'
    };

    const sortField = allowedSortMap[query.sortBy || ''] || 'sale.createdAt';
    qb.orderBy(sortField, query.sortOrderSafe);
    
    if (sortField !== 'sale.createdAt') {
      qb.addOrderBy('sale.createdAt', 'DESC');
    }

    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: string, manager?: EntityManager): Promise<Sale> {
    const repo = manager ? manager.getRepository(Sale) : this.saleRepo;
    const sale = await repo.findOne({
      where: { id },
      relations: ['party', 'saleType', 'currency', 'staff', 'commercialAccount', 'department', 'items', 'items.item', 'cancelledBy'],
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    return sale;
  }

  async getStatus() {
    const firstDayOfMonth = dayjs().startOf('month').toDate();

    const [stats, pending] = await Promise.all([
      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
        .addSelect("COUNT(*)", "total")
        .where("sale.createdAt >= :date", { date: DateUtils.getStartOfDay(firstDayOfMonth) })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne(),
      this.saleRepo.count({ where: { status: 'draft' } }),
    ]);

    return {
      monthlyRevenue: new Decimal(stats?.revenue || 0),
      monthlyOrders: new Decimal(stats?.total || 0),
      pendingOrders: new Decimal(pending || 0),
    };
  }

  async exportToExcel(query: SalesQueryDto, user: JwtPayload): Promise<StreamableFile> {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .leftJoin('sale.party', 'party')
      .leftJoin('sale.currency', 'currency')
      .select([
        'sale.id', 'sale.code', 'sale.createdAt', 'sale.phone',
        'sale.grandTotal', 'sale.status', 'sale.deliveryDate', 'sale.profit',
        'party.id', 'party.name', 'party.phone1',
        'currency.id', 'currency.symbol'
      ]);

    if (query.status) qb.andWhere('sale.status = :status', { status: query.status });
    
    if (user && !user.isSystemAdmin) {
      const hasViewAll = 
        user.permissions?.includes('SALES_VIEW_ALL') || 
        user.permissions?.includes('sales_view_all') ||
        user.permissions?.includes('SALES_MASTER_VIEW') ||
        user.permissions?.includes('sales_master_view');

      if (hasViewAll) {
        // No department constraint
      } else {
        const hasViewDept = 
          user.permissions?.includes('SALES_VIEW_DEPT') || 
          user.permissions?.includes('sales_view_dept') ||
          user.permissions?.includes('SALES_APPROVE') || 
          user.permissions?.includes('sales_approve') ||
          user.permissions?.includes('SALES_MASTER_APPROVE') || 
          user.permissions?.includes('sales_master_approve');

        if (hasViewDept && user.departmentId) {
          qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
        } else {
          qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
        }
      }
    }

    const sales = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Satislar');

    worksheet.columns = [
      { header: 'Satış No', key: 'code', width: 15 },
      { header: 'Tarih', key: 'date', width: 15 },
      { header: 'Müşteri', key: 'party', width: 25 },
      { header: 'Telefon', key: 'phone', width: 15 },
      { header: 'Tutar', key: 'total', width: 15 },
      { header: 'Döviz', key: 'currency', width: 10 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Teslimat', key: 'delivery', width: 15 },
      { header: 'Kar/Zarar', key: 'profit', width: 15 },
    ];

    const statusMap: Record<string, string> = {
      'draft': 'Taslak',
      'approved': 'Onaylandı',
      'shipped': 'Sevk Edildi',
      'invoiced': 'Faturalandı',
      'cancelled': 'İptal'
    };

    sales.forEach(s => {
      worksheet.addRow({
        code: s.code,
        date: dayjs(s.createdAt).format('DD.MM.YYYY'),
        party: s.party?.name || '—',
        phone: s.phone || s.party?.phone1 || '—',
        total: s.grandTotal.toNumber(),
        currency: s.currency?.symbol || '₺',
        status: statusMap[s.status] || s.status,
        delivery: s.deliveryDate || '—',
        profit: s.profit.toNumber(),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }

  async fetchItemData(manager: EntityManager, itemIds: string[]): Promise<Map<string, ItemData>> {
    const items = await manager.find(Item, {
      where: { id: In(itemIds), state: 1 }
    });
    
    if (items.length !== itemIds.length) {
      const foundIds = items.map(i => i.id);
      const missing = itemIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Bazı ürünler bulunamadı veya pasif: ${missing.join(', ')}`);
    }

    const map = new Map<string, ItemData>();
    items.forEach(i => map.set(i.id, { 
      id: i.id, 
      salePrice: i.salePrice || 0,
      purchasePrice: i.purchasePrice || 0
    }));
    return map;
  }

  async getPeriodSummary(query: { year: number | string; month?: number | string; departmentId?: string }, user: JwtPayload): Promise<any> {
    const year = Number(query.year) || dayjs().year();
    const month = query.month ? Number(query.month) : undefined;
    
    let startDate: Date;
    let endDate: Date;
    let periodType: 'monthly' | 'yearly';
    let label: string;

    const monthNames = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    if (month && month >= 1 && month <= 12) {
      periodType = 'monthly';
      startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
      endDate = dayjs(startDate).endOf('month').toDate();
      label = `${monthNames[month]} ${year}`;
    } else {
      periodType = 'yearly';
      startDate = dayjs(`${year}-01-01`).startOf('year').toDate();
      endDate = dayjs(`${year}-12-31`).endOf('year').toDate();
      label = `${year} Yılı`;
    }

    const qb = this.saleRepo.createQueryBuilder('sale')
      .leftJoin('sale.party', 'party')
      .leftJoin('sale.currency', 'currency')
      .leftJoin('sale.department', 'department')
      .select([
        'sale.id', 'sale.code', 'sale.createdAt', 'sale.status',
        'sale.grandTotal', 'sale.exchangeRate', 'sale.paymentType', 'sale.paidAmount',
        'party.id', 'party.name',
        'currency.id', 'currency.symbol',
        'department.id', 'department.name'
      ])
      .where('sale.createdAt >= :startDate AND sale.createdAt <= :endDate', { startDate, endDate });

    let departmentScopeName = 'Tüm Şirket / Tüm Departmanlar';

    if (user && !user.isSystemAdmin) {
      const hasViewAll = 
        user.permissions?.includes('SALES_VIEW_ALL') || 
        user.permissions?.includes('sales_view_all') ||
        user.permissions?.includes('SALES_MASTER_VIEW') ||
        user.permissions?.includes('sales_master_view');

      if (hasViewAll) {
        if (query.departmentId) {
          qb.andWhere('sale.departmentId = :deptId', { deptId: query.departmentId });
        }
      } else {
        const hasViewDept = 
          user.permissions?.includes('SALES_VIEW_DEPT') || 
          user.permissions?.includes('sales_view_dept');

        if (hasViewDept && user.departmentId) {
          qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
        } else {
          qb.andWhere('sale.createdBy = :userId', { userId: String(user.sub) });
        }
      }
    } else if (query.departmentId) {
      qb.andWhere('sale.departmentId = :deptId', { deptId: query.departmentId });
    }

    const sales = await qb.orderBy('sale.createdAt', 'DESC').getMany();

    if (query.departmentId && sales.length > 0 && sales[0].department) {
      departmentScopeName = sales[0].department.name;
    } else if (user && !user.isSystemAdmin && user.departmentId && sales.length > 0 && sales[0].department) {
      departmentScopeName = sales[0].department.name;
    }

    let totalRevenue = new Decimal(0);
    let completedRevenue = new Decimal(0);
    let pendingRevenue = new Decimal(0);
    let cancelledRevenue = new Decimal(0);

    let totalCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    const completedStatuses = ['approved', 'shipped', 'completed', 'invoiced'];

    sales.forEach(sale => {
      const grandTotal = new Decimal(sale.grandTotal || 0);
      const rate = new Decimal(sale.exchangeRate || 1);
      const tlAmount = grandTotal.mul(rate);

      totalRevenue = totalRevenue.add(tlAmount);
      totalCount++;

      if (completedStatuses.includes(sale.status)) {
        completedRevenue = completedRevenue.add(tlAmount);
        completedCount++;
      } else if (sale.status === 'cancelled') {
        cancelledRevenue = cancelledRevenue.add(tlAmount);
        cancelledCount++;
      } else {
        pendingRevenue = pendingRevenue.add(tlAmount);
        pendingCount++;
      }
    });

    return {
      period: {
        type: periodType,
        year,
        month: month || null,
        label,
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      },
      departmentName: departmentScopeName,
      summary: {
        totalRevenue: totalRevenue.toDecimalPlaces(2).toNumber(),
        completedRevenue: completedRevenue.toDecimalPlaces(2).toNumber(),
        pendingRevenue: pendingRevenue.toDecimalPlaces(2).toNumber(),
        cancelledRevenue: cancelledRevenue.toDecimalPlaces(2).toNumber(),
        totalCount,
        completedCount,
        pendingCount,
        cancelledCount,
      },
      sales: sales.map(s => ({
        id: s.id,
        code: s.code,
        date: dayjs(s.createdAt).format('DD.MM.YYYY'),
        partyName: s.party?.name || '—',
        departmentName: s.department?.name || '—',
        status: s.status,
        grandTotal: new Decimal(s.grandTotal || 0).toNumber(),
        tlTotal: new Decimal(s.grandTotal || 0).mul(s.exchangeRate || 1).toDecimalPlaces(2).toNumber(),
        currencySymbol: s.currency?.symbol || '₺',
        paymentType: s.paymentType || 'NAKİT',
      })),
    };
  }
}

