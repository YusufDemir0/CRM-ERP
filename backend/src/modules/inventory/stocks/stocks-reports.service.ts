import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Item } from '../items/entities/item.entity';
import { Department } from '../../departments/entities/department.entity';
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

  private checkViewAll(user?: JwtPayload): boolean {
    if (!user) return false;
    if (user.isSystemAdmin) return true;
    return !!(
      user.permissions?.includes('INVENTORY_VIEW_ALL') ||
      user.permissions?.includes('inventory_view_all')
    );
  }

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

    const hasViewAll = this.checkViewAll(user);

    if (!hasViewAll) {
      if (user?.departmentId) {
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

    const hasViewAll = this.checkViewAll(user);

    if (!hasViewAll) {
      if (user?.departmentId) {
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

    const hasViewAll = this.checkViewAll(user);

    if (!hasViewAll) {
      if (user?.departmentId) {
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

    const hasViewAll = this.checkViewAll(user);

    if (!hasViewAll) {
      if (user?.departmentId) {
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

    const hasViewAll = this.checkViewAll(user);

    if (!hasViewAll) {
      if (user?.departmentId) {
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

  async getDepartmentStockSummary(query: { departmentId?: string }, user?: JwtPayload): Promise<any> {
    const hasViewAll = this.checkViewAll(user);

    const deptQb = this.stockRepo.manager.getRepository(Department).createQueryBuilder('dept')
      .where('dept.state = 1');

    if (!hasViewAll) {
      if (user?.departmentId) {
        deptQb.andWhere('dept.id = :userDeptId', { userDeptId: String(user.departmentId) });
      } else {
        deptQb.andWhere('1 = 0');
      }
    } else if (query.departmentId) {
      deptQb.andWhere('dept.id = :deptId', { deptId: String(query.departmentId) });
    }

    const departments = await deptQb.orderBy('dept.name', 'ASC').getMany();

    // Query all active items
    const allItems = await this.stockRepo.manager.getRepository(Item).createQueryBuilder('item')
      .leftJoinAndSelect('item.itemType', 'itemType')
      .leftJoinAndSelect('item.quantityType', 'quantityType')
      .where('item.state = 1')
      .orderBy('item.name', 'ASC')
      .getMany();

    const result = [];

    for (const dept of departments) {
      // Find all stocks for this department
      const stocks = await this.stockRepo.find({
        where: { departmentId: dept.id },
      });
      const stockMap = new Map<string, Stock>();
      stocks.forEach(s => stockMap.set(String(s.itemId), s));

      const inStock: any[] = [];
      const criticalStock: any[] = [];
      const outOfStock: any[] = [];

      for (const item of allItems) {
        const stock = stockMap.get(String(item.id));
        const quantity = stock ? new Decimal(stock.quantity || 0) : new Decimal(0);
        const reservedQuantity = stock ? new Decimal(stock.reservedQuantity || 0) : new Decimal(0);
        const criticalLimit = new Decimal(item.criticalLimit || 0);

        const itemDto = {
          id: item.id,
          code: item.code,
          name: item.name,
          category: item.itemType?.name || 'Genel',
          unit: item.quantityType?.abbreviation || 'ADET',
          quantity: quantity.toNumber(),
          reservedQuantity: reservedQuantity.toNumber(),
          criticalLimit: criticalLimit.toNumber(),
        };

        if (quantity.lte(0)) {
          outOfStock.push(itemDto);
        } else if (criticalLimit.gt(0) && quantity.lte(criticalLimit)) {
          criticalStock.push(itemDto);
        } else {
          inStock.push(itemDto);
        }
      }

      result.push({
        departmentId: dept.id,
        departmentName: dept.name,
        counts: {
          totalItems: allItems.length,
          inStockCount: inStock.length,
          criticalCount: criticalStock.length,
          outOfStockCount: outOfStock.length,
        },
        inStock,
        criticalStock,
        outOfStock,
      });
    }

    return {
      reportDate: dayjs().format('DD.MM.YYYY HH:mm'),
      departmentCount: departments.length,
      scope: hasViewAll && !query.departmentId ? 'Tüm Departmanlar / Depolar' : (departments[0]?.name || 'Departman'),
      departments: result,
    };
  }
}

