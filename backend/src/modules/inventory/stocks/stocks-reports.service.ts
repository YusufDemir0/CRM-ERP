import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StocksQueryDto } from '../dto/inventory.dto';
import { PaginatedResult, PaginationDto } from '../../../common/dto/pagination.dto';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';
import { Decimal } from 'decimal.js';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class StocksReportsService {
  private readonly logger = new Logger(StocksReportsService.name);

  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
  ) {}

  async findAll(query: StocksQueryDto, user?: JwtPayload): Promise<PaginatedResult<Stock>> {
    const qb = this.stockRepo.createQueryBuilder('stock')
      .leftJoin('stock.item', 'item')
      .leftJoin('item.itemType', 'itemType')
      .leftJoin('item.quantityType', 'quantityType')
      .leftJoin('stock.department', 'department')
      .select([
        'stock.id', 'stock.quantity', 'stock.reservedQuantity', 'stock.updatedAt',
        'item.id', 'item.name', 'item.code', 'item.criticalLimit', 'item.state',
        'itemType.id', 'itemType.name',
        'quantityType.id', 'quantityType.abbreviation',
        'department.id', 'department.name'
      ]);

    if (user && !user.isSystemAdmin) {
      if (user.departmentId) {
        qb.andWhere('stock.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
      } else {
        qb.andWhere('1 = 0');
      }
    } else if (query.departmentId) {
      qb.andWhere('stock.departmentId = :deptId', { deptId: query.departmentId });
    }
    if (query.itemId) qb.andWhere('stock.itemId = :itemId', { itemId: query.itemId });
    qb.andWhere('stock.quantity <> 0');
    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(item.name LIKE :s OR item.code LIKE :s)', { s });
    }

    if (query.state !== undefined) {
      qb.andWhere('item.state = :state', { state: query.state });
    }

    if (query.isCritical === 'true') {
      qb.andWhere('stock.quantity <= item.criticalLimit AND item.criticalLimit > 0');
    }

    const sortFieldMap: Record<string, string> = {
      'quantity': 'stock.quantity',
      'item.name': 'item.name',
      'department.name': 'department.name',
      'updatedAt': 'stock.updatedAt'
    };

    const sortCol = sortFieldMap[query.sortBy || ''] || 'stock.updatedAt';
    qb.orderBy(sortCol, query.sortOrderSafe);
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    
    return {
      data,
      meta: { 
        total, 
        page: query.page || 1, 
        limit: query.limit || 20, 
        totalPages: Math.ceil(total / (query.limit || 20)) 
      },
    };
  }

  async findAllMovements(query: PaginationDto & { type?: string; search?: string }, user?: JwtPayload): Promise<PaginatedResult<StockMovement>> {
    const qb = this.movementRepo.createQueryBuilder('sm')
      .leftJoin('sm.stock', 'stock')
      .leftJoin('stock.item', 'item')
      .leftJoin('stock.department', 'department')
      .select([
        'sm.id', 'sm.quantity', 'sm.type', 'sm.referenceType', 'sm.referenceId', 'sm.createdAt', 'sm.notes', 'sm.description',
        'sm.quantityBefore', 'sm.quantityAfter', 'sm.unitCost', 'sm.totalCost',
        'stock.id', 'stock.quantity',
        'item.id', 'item.code', 'item.name',
        'department.id', 'department.name'
      ])
      .orderBy('sm.createdAt', 'DESC');

    if (user && !user.isSystemAdmin) {
      if (user.departmentId) {
        qb.andWhere('stock.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    if (query.type) {
      qb.andWhere('sm.type = :type', { type: query.type });
    }

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(item.name LIKE :s OR item.code LIKE :s OR sm.description LIKE :s)', { s });
    }

    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async getMovements(stockId: string, query: PaginationDto, user?: JwtPayload): Promise<PaginatedResult<StockMovement>> {
    const qb = this.movementRepo.createQueryBuilder('sm')
      .leftJoin('sm.stock', 'stock')
      .where('sm.stockId = :stockId', { stockId })
      .orderBy('sm.createdAt', 'DESC');

    if (user && !user.isSystemAdmin) {
      if (user.departmentId) {
        qb.andWhere('stock.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async getCriticalStocks(query: PaginationDto, user?: JwtPayload): Promise<PaginatedResult<Stock>> {
    const qb = this.stockRepo.createQueryBuilder('stock')
      .leftJoin('stock.item', 'item')
      .leftJoin('stock.department', 'department')
      .select([
        'stock.id', 'stock.quantity',
        'item.id', 'item.name', 'item.code', 'item.criticalLimit',
        'department.id', 'department.name'
      ])
      .where('stock.quantity <= item.criticalLimit')
      .andWhere('item.criticalLimit > 0');

    if (user && !user.isSystemAdmin) {
      if (user.departmentId) {
        qb.andWhere('stock.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.orderBy('stock.quantity', 'ASC')
      .skip(query.skip)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async getStockReport() {
    const qb = this.stockRepo.createQueryBuilder('stock')
      .leftJoin('stock.item', 'item')
      .select('SUM(stock.quantity * item.movingAverageCost)', 'totalValue')
      .addSelect('COUNT(DISTINCT stock.itemId)', 'totalItems');
      
    return await qb.getRawOne();
  }

  async getStatus(user?: JwtPayload) {
    const qbTotal = this.stockRepo.createQueryBuilder('stock')
      .select("COUNT(DISTINCT stock.itemId)", "items")
      .addSelect("SUM(stock.quantity)", "quantity");

    const qbCritical = this.stockRepo.createQueryBuilder('stock')
      .innerJoin('stock.item', 'item')
      .where('stock.quantity <= item.criticalLimit')
      .andWhere('item.criticalLimit > 0')
      .select("COUNT(*)", "count");

    if (user && !user.isSystemAdmin) {
      if (user.departmentId) {
        qbTotal.andWhere('stock.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
        qbCritical.andWhere('stock.departmentId = :userDeptId', { userDeptId: String(user.departmentId) });
      } else {
        qbTotal.andWhere('1 = 0');
        qbCritical.andWhere('1 = 0');
      }
    }

    const [total, critical] = await Promise.all([
      qbTotal.getRawOne(),
      qbCritical.getRawOne(),
    ]);

    return {
      totalItems: Number(total.items || 0),
      totalQuantity: new Decimal(total.quantity || 0).toFixed(2),
      criticalCount: Number(critical.count || 0),
    };
  }
}
