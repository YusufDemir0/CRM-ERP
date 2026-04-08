import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, TransferStockDto } from '../dto/inventory.dto';
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

  async adjustStock(dto: StockAdjustmentDto, userId?: number): Promise<StockMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let stock = await queryRunner.manager.findOne(Stock, {
        where: { itemId: dto.itemId, departmentId: dto.departmentId },
      });

      if (!stock) {
        stock = queryRunner.manager.create(Stock, {
          itemId: dto.itemId, departmentId: dto.departmentId, quantity: 0, createdBy: userId,
        });
        stock = await queryRunner.manager.save(stock);
      }

      const quantityBefore = Number(stock.quantity);
      let quantityAfter: number;

      if (dto.type === 'in') {
        quantityAfter = quantityBefore + dto.quantity;
      } else {
        if (quantityBefore < dto.quantity) {
          throw new BadRequestException(`Yetersiz stok. Mevcut: ${quantityBefore}, İstenen: ${dto.quantity}`);
        }
        quantityAfter = quantityBefore - dto.quantity;
      }

      await queryRunner.manager.update(Stock, stock.id, { quantity: quantityAfter, updatedBy: userId });

      const movement = queryRunner.manager.create(StockMovement, {
        stockId: stock.id, quantity: dto.quantity, quantityBefore, quantityAfter,
        type: dto.type, referenceType: 'manual', description: dto.description, notes: dto.notes, createdBy: userId,
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

  // YENİ EKLENDİ: TEK TRANSACTION İÇİNDE STOK TRANSFERİ (A DEPOSUNDAN ÇIK -> B DEPOSUNA GİR)
  async transferStock(dto: TransferStockDto, userId?: number) {
    if (dto.fromDepartmentId === dto.toDepartmentId) {
      throw new BadRequestException('Kaynak depo ile Hedef depo aynı olamaz.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. KAYNAK (ÇIKIŞ) DEPOSU KONTROLLERİ
      const sourceStock = await queryRunner.manager.findOne(Stock, { 
        where: { itemId: dto.itemId, departmentId: dto.fromDepartmentId }
      });

      if (!sourceStock || Number(sourceStock.quantity) < dto.quantity) {
        throw new BadRequestException(`Kaynak depoda yeterli stok bulunmuyor. Mevcut: ${sourceStock ? sourceStock.quantity : 0}`);
      }

      const sourceQtyBefore = Number(sourceStock.quantity);
      const sourceQtyAfter = sourceQtyBefore - dto.quantity;

      // Çıkış yap
      await queryRunner.manager.update(Stock, sourceStock.id, { quantity: sourceQtyAfter, updatedBy: userId });
      
      // Çıkış Hareket Kaydı
      await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
        stockId: sourceStock.id, quantity: dto.quantity, quantityBefore: sourceQtyBefore, quantityAfter: sourceQtyAfter,
        type: 'out', referenceType: 'adjustment', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
      }));


      // 2. HEDEF (GİRİŞ) DEPOSU İŞLEMLERİ
      let targetStock = await queryRunner.manager.findOne(Stock, { 
        where: { itemId: dto.itemId, departmentId: dto.toDepartmentId }
      });

      if (!targetStock) {
        targetStock = queryRunner.manager.create(Stock, { 
          itemId: dto.itemId, departmentId: dto.toDepartmentId, quantity: 0, createdBy: userId 
        });
        targetStock = await queryRunner.manager.save(targetStock);
      }

      const targetQtyBefore = Number(targetStock.quantity);
      const targetQtyAfter = targetQtyBefore + dto.quantity;

      // Giriş yap
      await queryRunner.manager.update(Stock, targetStock.id, { quantity: targetQtyAfter, updatedBy: userId });

      // Giriş Hareket Kaydı
      await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
        stockId: targetStock.id, quantity: dto.quantity, quantityBefore: targetQtyBefore, quantityAfter: targetQtyAfter,
        type: 'in', referenceType: 'adjustment', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
      }));

      // İŞLEMLER BAŞARILI, COMMIT
      await queryRunner.commitTransaction();
      return { success: true, message: 'Transfer başarıyla gerçekleşti.' };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async getCriticalStocks(): Promise<Stock[]> {
    return this.stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.item', 'item')
      .leftJoinAndSelect('stock.department', 'department')
      .where('stock.quantity <= item.criticalLimit')
      .andWhere('item.criticalLimit > 0')
      .getMany();
  }

  async getStatus() {
    const [total, critical] = await Promise.all([
      this.stockRepo.createQueryBuilder('stock')
        .select("COUNT(DISTINCT stock.itemId)", "items")
        .addSelect("SUM(stock.quantity)", "quantity")
        .getRawOne(),
      this.stockRepo.createQueryBuilder('stock')
        .innerJoin('stock.item', 'item')
        .where('stock.quantity <= item.criticalLimit')
        .andWhere('item.criticalLimit > 0')
        .select("COUNT(*)", "count")
        .getRawOne(),
    ]);

    return {
      totalItems: Number(total.items || 0),
      totalQuantity: Number(total.quantity || 0),
      criticalCount: Number(critical.count || 0),
    };
  }
}