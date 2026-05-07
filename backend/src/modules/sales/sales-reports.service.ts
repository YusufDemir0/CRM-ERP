import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { Response } from 'express';
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

  async findAll(query: SalesQueryDto, user?: JwtPayload): Promise<PaginatedResult<Sale>> {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .select([
        'sale.id', 'sale.code', 'sale.status', 'sale.totalAmount', 'sale.grandTotal',
        'sale.kdv', 'sale.discountAmount', 'sale.createdAt', 'sale.updatedAt',
        'sale.deliveryDate', 'sale.phone', 'sale.address'
      ])
      .leftJoin('sale.party', 'party')
      .addSelect(['party.id', 'party.name', 'party.type'])
      .leftJoin('sale.saleType', 'saleType')
      .addSelect(['saleType.id', 'saleType.name', 'saleType.abbreviation'])
      .leftJoin('sale.currency', 'currency')
      .addSelect(['currency.id', 'currency.symbol', 'currency.code']);

    if (query.search) {
      qb.andWhere(
        '(sale.code LIKE :s OR sale.notes LIKE :s OR sale.phone LIKE :s OR sale.address LIKE :s OR sale.city LIKE :s OR sale.district LIKE :s OR sale.taxNumber LIKE :s OR sale.email LIKE :s OR sale.source LIKE :s OR party.name LIKE :s)',
        { s: `%${query.search}%` }
      );
    }
    if (query.status) qb.andWhere('sale.status = :status', { status: query.status });
    if (query.partyId) qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });

    if (user && !user.isSystemAdmin) {
      const hasViewAll = user.permissions?.includes('SALES_VIEW_ALL');
      if (!hasViewAll && user.departmentId) {
        qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
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
      relations: ['party', 'saleType', 'currency', 'items', 'items.item'],
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
      monthlyRevenue: new Decimal(stats.revenue || 0),
      monthlyOrders: new Decimal(stats.total || 0),
      pendingOrders: new Decimal(pending || 0),
    };
  }

  async exportToExcel(query: SalesQueryDto, user: JwtPayload, res: Response) {
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
       const hasViewAll = user.permissions?.includes('SALES_VIEW_ALL');
       if (!hasViewAll && user.departmentId) {
         qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
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

    sales.forEach(s => {
      worksheet.addRow({
        code: s.code,
        date: dayjs(s.createdAt).format('DD.MM.YYYY'),
        party: s.party?.name || '—',
        phone: s.phone || s.party?.phone1 || '—',
        total: s.grandTotal.toNumber(),
        currency: s.currency?.symbol || '₺',
        status: s.status,
        delivery: s.deliveryDate || '—',
        profit: s.profit.toNumber(),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Satis_Raporu_${dayjs().format('YYYYMMDD')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
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
}
