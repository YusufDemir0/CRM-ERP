import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Decimal } from 'decimal.js';

dayjs.extend(utc);
dayjs.extend(timezone);

import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { Item } from '../items/entities/item.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { FinanceHelper } from '../../../common/utils/finance.helper';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  async findAll(query: StocksQueryDto): Promise<PaginatedResult<Stock>> {
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

    if ((query as any).isCritical === 'true' || (query as any).isCritical === true) {
      qb.andWhere('stock.quantity <= item.criticalLimit');
      qb.andWhere('item.criticalLimit > 0');
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
        lock: { mode: 'pessimistic_write' }
      });

      if (!stock) {
        stock = queryRunner.manager.create(Stock, {
          itemId: dto.itemId, departmentId: dto.departmentId, quantity: new Decimal(0), createdBy: userId,
        });
        stock = await queryRunner.manager.save(stock);
      }

      const quantityBefore = new Decimal(stock.quantity);
      let quantityAfter: Decimal;

      if (dto.type === 'in') {
        quantityAfter = FinanceHelper.add(quantityBefore, dto.quantity);
      } else {
        if (quantityBefore.lt(dto.quantity)) {
          throw new BadRequestException(`Yetersiz stok. Mevcut: ${quantityBefore.toString()}, İstenen: ${dto.quantity}`);
        }
        quantityAfter = FinanceHelper.sub(quantityBefore, dto.quantity);
      }

      await queryRunner.manager.update(Stock, stock.id, { quantity: quantityAfter, updatedBy: userId });

      const movement = queryRunner.manager.create(StockMovement, {
        stockId: stock.id, quantity: dto.quantity, quantityBefore, quantityAfter,
        type: dto.type, referenceType: 'manual', description: dto.description, notes: dto.notes, createdBy: userId,
      });

      const savedMovement = await queryRunner.manager.save(movement);

      // FİNANSAL SENKRONİZASYON
      const item = await queryRunner.manager.findOne(Item, { where: { id: dto.itemId } });
      
      if (item) {
        // Maliyet kaydı: miktar * alış fiyatı
        const totalCostValue = FinanceHelper.mul(item.purchasePrice || 0, dto.quantity);

        if (!new Decimal(totalCostValue).isZero()) {
          const txType = dto.type === 'in' ? 'in' : 'out';
          const txPrefix = txType === 'in' ? 'SFG' : 'SFC'; // Stok Fişi Giriş / Çıkış
          const txCode = await this.sequenceGenerator.generateTransactionCode(queryRunner, txPrefix);

          const transaction = queryRunner.manager.create(Transaction, {
            code: txCode,
            amount: totalCostValue,
            type: txType,
            date: DateUtils.getToday(),
            referenceType: 'manual_adjustment',
            referenceId: savedMovement.id,
            description: `Stok Ayarlaması Değer Kaydı: ${item.name} (${dto.type === 'in' ? '+' : '-'}${dto.quantity} Adet)`,
            status: 'completed',
            createdBy: userId,
          });

          await queryRunner.manager.save(transaction);
        }
      }

      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transferStock(dto: TransferStockDto, userId?: number) {
    if (dto.fromDepartmentId === dto.toDepartmentId) {
      throw new BadRequestException('Kaynak depo ile Hedef depo aynı olamaz.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // DB-02: Deadlock Prevention - Sıralı Kilitleme (Ordered Locking)
      // İki depo arasında eşzamanlı çapraz transferlerde (A->B ve B->A) deadlock oluşmaması için 
      // her zaman ID'si küçük olandan başlayarak kilit atıyoruz.
      const deptIds = [dto.fromDepartmentId, dto.toDepartmentId].sort((a, b) => a - b);
      
      const stocks: Record<number, Stock> = {};

      for (const deptId of deptIds) {
        let s = await queryRunner.manager.findOne(Stock, {
          where: { itemId: dto.itemId, departmentId: deptId },
          lock: { mode: 'pessimistic_write' }
        });

        if (!s) {
          // Eğer stok kaydı yoksa oluştur ve kilitli tut
          s = queryRunner.manager.create(Stock, { 
            itemId: dto.itemId, departmentId: deptId, quantity: new Decimal(0), createdBy: userId 
          });
          s = await queryRunner.manager.save(s);
          // Tekrar oku (Bazı DB engine'lerde yeni satıra lock atmak için gerekebilir)
          s = await queryRunner.manager.findOne(Stock, {
            where: { id: s.id },
            lock: { mode: 'pessimistic_write' }
          });
        }
        stocks[deptId] = s!;
      }

      const sourceStock = stocks[dto.fromDepartmentId];
      const targetStock = stocks[dto.toDepartmentId];

      if (new Decimal(sourceStock.quantity).lt(dto.quantity)) {
        throw new BadRequestException(`Kaynak depoda yeterli stok bulunmuyor. Mevcut: ${sourceStock.quantity.toString()}`);
      }

      const sourceQtyBefore = new Decimal(sourceStock.quantity);
      const sourceQtyAfter = FinanceHelper.sub(sourceQtyBefore, dto.quantity);
      const targetQtyBefore = new Decimal(targetStock.quantity);
      const targetQtyAfter = FinanceHelper.add(targetQtyBefore, dto.quantity);

      // 1. Kaynak Çıkış
      await queryRunner.manager.update(Stock, sourceStock.id, { quantity: sourceQtyAfter, updatedBy: userId });
      await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
        stockId: sourceStock.id, quantity: dto.quantity, quantityBefore: sourceQtyBefore, quantityAfter: sourceQtyAfter,
        type: 'out', referenceType: 'adjustment', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
      }));

      // 2. Hedef Giriş
      await queryRunner.manager.update(Stock, targetStock.id, { quantity: targetQtyAfter, updatedBy: userId });
      await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
        stockId: targetStock.id, quantity: dto.quantity, quantityBefore: targetQtyBefore, quantityAfter: targetQtyAfter,
        type: 'in', referenceType: 'adjustment', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
      }));

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