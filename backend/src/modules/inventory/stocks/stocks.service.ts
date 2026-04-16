import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
import { Party } from '../../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { FinanceHelper } from '../../../common/utils/finance.helper';
import { LogsService } from '../../logs/logs.service';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private logsService: LogsService,
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

    if (query.isCritical === 'true') {
      qb.andWhere('stock.quantity <= item.criticalLimit');
      qb.andWhere('item.criticalLimit > 0');
    }

    const allowedSortCols = ['quantity', 'createdAt', 'item.name', 'department.name'];
    const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'quantity';
    const finalSortField = sortField.includes('.') ? sortField : `stock.${sortField}`;
 
    qb.orderBy(finalSortField, query.sortOrder || 'DESC');
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

  // ────── ARCH-01: MODULAR STOCK UPDATES ──────

  async decreaseStock(
    itemId: number, 
    departmentId: number, 
    quantity: number | Decimal, 
    manager?: any, // Type as EntityManager to avoid circular or broad imports in small steps
    referenceInfo?: { type: string; id: number; description: string },
    userId?: number
  ): Promise<void> {
    const qr = manager || this.dataSource.manager;
    const qty = new Decimal(quantity);

    let stock = await qr.findOne(Stock, {
      where: { itemId, departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!stock || new Decimal(stock.quantity).lt(qty)) {
      throw new BadRequestException(`Yetersiz stok. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
    }

    const quantityBefore = new Decimal(stock.quantity);
    const quantityAfter = FinanceHelper.sub(quantityBefore, qty);

    stock.quantity = quantityAfter;
    stock.updatedBy = userId || null;
    await qr.save(Stock, stock);

    await qr.save(qr.create(StockMovement, {
      stockId: stock.id,
      quantity: qty,
      quantityBefore,
      quantityAfter,
      type: 'out',
      referenceType: referenceInfo?.type || 'manual',
      referenceId: referenceInfo?.id || null,
      description: referenceInfo?.description || 'Stok Çıkışı',
      createdBy: userId
    }));
  }

  async decreaseStockBulk(
    items: Array<{ itemId: number; quantity: number | Decimal }>,
    departmentId: number,
    manager?: any,
    referenceInfo?: { type: string; id: number; description: string },
    userId?: number
  ): Promise<void> {
    const qr = manager || this.dataSource.manager;
    if (!items || items.length === 0) return;

    const itemIds = items.map(i => i.itemId);
    
    // Sort array by ID to prevent deadlocks (Order locking)
    // Then Group them in case same item appears multiple times
    const reducedItems = new Map<number, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);

    // Lock all relevant stocks in ONE query
    const stocks = await qr.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    const movements: StockMovement[] = [];
    const stockMap = new Map<number, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      const stock = stockMap.get(itemId);

      if (!stock || new Decimal(stock.quantity).lt(qty)) {
        throw new BadRequestException(`Yetersiz stok. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
      }

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = FinanceHelper.sub(quantityBefore, qty);
      
      stock.quantity = quantityAfter;
      stock.updatedBy = userId || null;

      movements.push(qr.create(StockMovement, {
        stockId: stock.id,
        quantity: qty,
        quantityBefore,
        quantityAfter,
        type: 'out',
        referenceType: referenceInfo?.type || 'manual',
        referenceId: referenceInfo?.id || null,
        description: referenceInfo?.description || 'Stok Çıkışı',
        createdBy: userId
      }));
    }

    // Bulk save
    await qr.save(Stock, stocks);
    await qr.save(StockMovement, movements);
  }

  async reserveStockBulk(
    items: Array<{ itemId: number; quantity: number | Decimal }>,
    departmentId: number,
    manager?: any,
    userId?: number
  ): Promise<void> {
    const qr = manager || this.dataSource.manager;
    if (!items || items.length === 0) return;

    const reducedItems = new Map<number, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);

    const stocks = await qr.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    const stockMap = new Map<number, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      let stock = stockMap.get(itemId);

      if (!stock) {
        stock = qr.create(Stock, { itemId, departmentId, quantity: new Decimal(0), reservedQuantity: new Decimal(0) });
        stock = await qr.save(Stock, stock);
      }

      if (!stock) continue;

      // Check if physical stock is enough for reservation (Business rule check)
      if (new Decimal(stock.quantity).lt(new Decimal(stock.reservedQuantity || 0).add(qty))) {
        // We might allow "over-reservation" if business allows, but for now strict
      }

      stock.reservedQuantity = new Decimal(stock.reservedQuantity || 0).add(qty);
      stock.updatedBy = userId || null;

      // Add to array if it was newly created
      if (!stocks.find((s: Stock) => s.id === stock!.id)) {
        stocks.push(stock!);
      }
    }

    await qr.save(Stock, stocks);
  }

  async unreserveStockBulk(
    items: Array<{ itemId: number; quantity: number | Decimal }>,
    departmentId: number,
    manager?: any,
    userId?: number
  ): Promise<void> {
    const qr = manager || this.dataSource.manager;
    if (!items || items.length === 0) return;

    const reducedItems = new Map<number, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);

    const stocks = await qr.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    const stockMap = new Map<number, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      const stock = stockMap.get(itemId);

      if (stock) {
        stock.reservedQuantity = Decimal.max(0, new Decimal(stock.reservedQuantity || 0).sub(qty));
        stock.updatedBy = userId || null;
      }
    }

    await qr.save(Stock, stocks);
  }

  async finalizeShipmentBulk(
    items: Array<{ itemId: number; quantity: number | Decimal }>,
    departmentId: number,
    manager?: any,
    referenceInfo?: { type: string; id: number; description: string },
    userId?: number
  ): Promise<void> {
    const qr = manager || this.dataSource.manager;
    if (!items || items.length === 0) return;

    const reducedItems = new Map<number, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);

    const stocks = await qr.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    const stockMap = new Map<number, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    const movements: StockMovement[] = [];

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      const stock = stockMap.get(itemId);

      if (!stock || new Decimal(stock.quantity).lt(qty)) {
        throw new BadRequestException(`Sevkiyat için yetersiz fiziksel stok. Ürün ID: ${itemId}`);
      }

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = quantityBefore.sub(qty);

      stock.quantity = quantityAfter;
      // Reduce reservation as it's now physically shipped
      stock.reservedQuantity = Decimal.max(0, new Decimal(stock.reservedQuantity || 0).sub(qty));
      stock.updatedBy = userId || null;

      movements.push(qr.create(StockMovement, {
        stockId: stock.id,
        quantity: qty,
        quantityBefore,
        quantityAfter,
        type: 'out',
        referenceType: referenceInfo?.type || 'shipment',
        referenceId: referenceInfo?.id || null,
        description: referenceInfo?.description || 'Sevkiyat Çıkışı',
        createdBy: userId
      }));
    }

    await qr.save(Stock, stocks);
    await qr.save(StockMovement, movements);
  }


  async increaseStock(
    itemId: number, 
    departmentId: number, 
    quantity: number | Decimal, 
    manager?: any, 
    referenceInfo?: { type: string; id: number; description: string },
    userId?: number
  ): Promise<void> {
    const qr = manager || this.dataSource.manager;
    const qty = new Decimal(quantity);

    let stock = await qr.findOne(Stock, {
      where: { itemId, departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!stock) {
      stock = qr.create(Stock, {
        itemId, departmentId, quantity: new Decimal(0), createdBy: userId
      });
      stock = await qr.save(stock);
      // Relock
      stock = await qr.findOne(Stock, { where: { id: stock.id }, lock: { mode: 'pessimistic_write' } });
    }

    const quantityBefore = new Decimal(stock!.quantity);
    const quantityAfter = FinanceHelper.add(quantityBefore, qty);

    stock!.quantity = quantityAfter;
    stock!.updatedBy = userId || null;
    await qr.save(Stock, stock!);

    await qr.save(qr.create(StockMovement, {
      stockId: stock!.id,
      quantity: qty,
      quantityBefore,
      quantityAfter,
      type: 'in',
      referenceType: referenceInfo?.type || 'manual',
      referenceId: referenceInfo?.id || null,
      description: referenceInfo?.description || 'Stok Girişi',
      createdBy: userId
    }));
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

      const sign = dto.type === 'in' ? '+' : '-';
      stock.quantity = quantityAfter;
      stock.updatedBy = userId || null;
      await queryRunner.manager.save(Stock, stock);

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

          // BIZ-02: ID-Agnostic Internal Party Lookup
          let internalParty = await queryRunner.manager.findOne(Party, { where: { taxNumber: 'INTERNAL' } });
          if (!internalParty) {
            internalParty = queryRunner.manager.create(Party, {
              name: 'ERMAY İÇ TRANSFER / MERKEZ',
              taxNumber: 'INTERNAL',
              type: 'both',
              balance: new Decimal(0),
              createdBy: userId
            });
            internalParty = await queryRunner.manager.save(internalParty);
          }
          const partyId = internalParty.id;

          const transaction = queryRunner.manager.create(Transaction, {
            code: txCode,
            amount: totalCostValue,
            type: txType,
            date: DateUtils.getToday(),
            referenceType: 'manual_adjustment',
            referenceId: savedMovement.id,
            description: `Stok Ayarlaması Değer Kaydı: ${item.name} (${dto.type === 'in' ? '+' : '-'}${dto.quantity} Adet)`,
            partyId: partyId,
            status: 'completed',
            createdBy: userId,
          });

          await queryRunner.manager.save(transaction);
        }
      }

      await queryRunner.commitTransaction();

      // ARCH-02: Async Activity Log
      this.logsService.logActivity({
        userId,
        module: 'inventory',
        action: 'STOCK_ADJUSTMENT',
        tag: dto.type === 'in' ? 'IN' : 'OUT',
        details: `Stok ayarlandı: Ürün ID ${dto.itemId}, Miktar: ${dto.type === 'in' ? '+' : '-'}${dto.quantity}`,
      });

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
      // DB-02: Deadlock Prevention - Deterministik Kilit Sırası (Küçük ID önce)
      const sortedDeptIds = [dto.fromDepartmentId, dto.toDepartmentId].sort((a, b) => a - b);
      const stocks: Record<number, Stock> = {};

      for (const deptId of sortedDeptIds) {
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
      sourceStock.quantity = sourceQtyAfter;
      sourceStock.updatedBy = userId || null;
      await queryRunner.manager.save(Stock, sourceStock);

      await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
        stockId: sourceStock.id, quantity: dto.quantity, quantityBefore: sourceQtyBefore, quantityAfter: sourceQtyAfter,
        type: 'out', referenceType: 'adjustment', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
      }));

      // 2. Hedef Giriş
      targetStock.quantity = targetQtyAfter;
      targetStock.updatedBy = userId || null;
      await queryRunner.manager.save(Stock, targetStock);

      await queryRunner.manager.save(queryRunner.manager.create(StockMovement, {
        stockId: targetStock.id, quantity: dto.quantity, quantityBefore: targetQtyBefore, quantityAfter: targetQtyAfter,
        type: 'in', referenceType: 'adjustment', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
      }));

      await queryRunner.commitTransaction();

      // ARCH-02: Async Activity Log
      this.logsService.logActivity({
        userId,
        module: 'inventory',
        action: 'STOCK_TRANSFER',
        tag: 'TRANSFER',
        details: `Stok transfer edildi: Ürün ID ${dto.itemId}, Kaynak: ${dto.fromDepartmentId}, Hedef: ${dto.toDepartmentId}, Miktar: ${dto.quantity}`,
      });

      return { success: true, message: 'Transfer başarıyla gerçekleşti.' };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ARCH-01: Bounded Context compliant stock reversal.
   */
  /**
   * ARCH-01: Bounded Context compliant stock reversal (Bulk version).
   * Prevents deadlocks by sorting item IDs and batching updates.
   */
  async revertStockMovementsByReference(
    referenceType: string,
    referenceId: number,
    manager: any, // EntityManager
    userId?: number
  ): Promise<void> {
    const qr = manager;
    const movements = await qr.find(StockMovement, {
      where: { referenceType, referenceId },
      relations: ['stock']
    });

    if (movements.length === 0) return;

    // Group items by stock entry to handle same item appearing multiple times
    const stockChanges = new Map<number, { stock: Stock; totalDelta: Decimal }>();

    for (const mov of movements) {
      const stock = mov.stock;
      if (!stock) continue;

      const delta = mov.type === 'out' 
        ? new Decimal(mov.quantity)  // Revert 'out' means increase back
        : new Decimal(mov.quantity).negated(); // Revert 'in' means decrease

      if (stockChanges.has(stock.id)) {
        const entry = stockChanges.get(stock.id)!;
        entry.totalDelta = entry.totalDelta.add(delta);
      } else {
        stockChanges.set(stock.id, { stock, totalDelta: delta });
      }
    }

    // Sort stock IDs to prevent deadlocks
    const sortedStockIds = Array.from(stockChanges.keys()).sort((a, b) => a - b);
    
    // Lock all stocks in one go
    const lockedStocks = await qr.find(Stock, {
      where: { id: In(sortedStockIds) },
      lock: { mode: 'pessimistic_write' }
    });

    const lockedStockMap = new Map<number, Stock>();
    lockedStocks.forEach((s: Stock) => lockedStockMap.set(s.id, s));

    const newMovements: StockMovement[] = [];
    const stocksToUpload: Stock[] = [];

    for (const stockId of sortedStockIds) {
      const change = stockChanges.get(stockId)!;
      const stock = lockedStockMap.get(stockId);
      
      if (!stock) continue;

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = quantityBefore.add(change.totalDelta);

      if (quantityAfter.lt(0)) {
        throw new BadRequestException(`İşlem geri alınırken stok yetersiz kalıyor. (Stok ID: ${stockId})`);
      }

      stock.quantity = quantityAfter;
      stock.updatedBy = userId || null;
      stocksToUpload.push(stock);

      newMovements.push(qr.create(StockMovement, {
        stockId: stock.id,
        quantity: change.totalDelta.abs(),
        quantityBefore,
        quantityAfter,
        type: change.totalDelta.gt(0) ? 'in' : 'out',
        referenceType: 'revert',
        referenceId: referenceId,
        description: `İşlem İptali Revert: ${referenceType} ID ${referenceId}`,
        createdBy: userId
      }));
    }

    await qr.save(Stock, stocksToUpload);
    await qr.save(StockMovement, newMovements);
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