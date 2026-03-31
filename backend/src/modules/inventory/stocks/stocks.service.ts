import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto } from '../dto/inventory.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: PaginationDto & { departmentId?: number; itemId?: number }): Promise<PaginatedResult<Stock>> {
    const qb = this.stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.item', 'item')
      .leftJoinAndSelect('item.itemType', 'itemType')
      .leftJoinAndSelect('item.quantityType', 'quantityType')
      .leftJoinAndSelect('stock.department', 'department');

    if (query.departmentId) qb.andWhere('stock.departmentId = :deptId', { deptId: query.departmentId });
    if (query.itemId) qb.andWhere('stock.itemId = :itemId', { itemId: query.itemId });
    if (query.search) {
      qb.andWhere('(item.name LIKE :s OR item.code LIKE :s)', { s: `%${query.search}%` });
    }

    qb.orderBy('stock.quantity', 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async getMovements(stockId: number, query: PaginationDto): Promise<PaginatedResult<StockMovement>> {
    const qb = this.movementRepo.createQueryBuilder('sm')
      .where('sm.stockId = :stockId', { stockId })
      .orderBy('sm.createdAt', 'DESC')
      .skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  /**
   * Manuel stok giriş/çıkış — ACID Transaction içinde
   */
  async adjustStock(dto: StockAdjustmentDto, userId?: number): Promise<StockMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Stok kaydını bul veya oluştur
      let stock = await queryRunner.manager.findOne(Stock, {
        where: { itemId: dto.itemId, departmentId: dto.departmentId },
      });

      if (!stock) {
        stock = queryRunner.manager.create(Stock, {
          itemId: dto.itemId,
          departmentId: dto.departmentId,
          quantity: 0,
          createdBy: userId,
        });
        stock = await queryRunner.manager.save(stock);
      }

      const quantityBefore = Number(stock.quantity);
      let quantityAfter: number;

      if (dto.type === 'in') {
        quantityAfter = quantityBefore + dto.quantity;
      } else {
        if (quantityBefore < dto.quantity) {
          throw new BadRequestException(
            `Yetersiz stok. Mevcut: ${quantityBefore}, İstenen: ${dto.quantity}`,
          );
        }
        quantityAfter = quantityBefore - dto.quantity;
      }

      // 2. Stok güncelle
      await queryRunner.manager.update(Stock, stock.id, {
        quantity: quantityAfter,
        updatedBy: userId,
      });

      // 3. Hareket kaydı oluştur
      const movement = queryRunner.manager.create(StockMovement, {
        stockId: stock.id,
        quantity: dto.quantity,
        quantityBefore,
        quantityAfter,
        type: dto.type,
        referenceType: 'manual',
        description: dto.description,
        notes: dto.notes,
        createdBy: userId,
      });

      const savedMovement = await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Kritik stok altındaki ürünleri getir
   */
  async getCriticalStocks(): Promise<Stock[]> {
    return this.stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.item', 'item')
      .leftJoinAndSelect('stock.department', 'department')
      .where('stock.quantity <= item.criticalLimit')
      .andWhere('item.criticalLimit > 0')
      .getMany();
  }
}
