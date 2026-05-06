import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, TransferStockDto } from '../dto/inventory.dto';
import { Item } from '../items/entities/item.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { FinanceHelper } from '../../../common/utils/finance.helper';
import { LogsService } from '../../logs/logs.service';
import { Transactional } from '@nestjs-cls/transactional';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { StockMovementHelper } from './domain/stock-movement.helper';

@Injectable()
export class StocksTransactionsService {
  private readonly logger = new Logger(StocksTransactionsService.name);
  
  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private logsService: LogsService,
    private transactionContext: TransactionContextService,
  ) {}

  private async updateMovingAverageCost(
    manager: EntityManager,
    itemId: string,
    inQty: Decimal,
    inUnitCost: Decimal,
    userId: string
  ): Promise<Decimal> {
    const item = await manager.findOne(Item, {
      where: { id: itemId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!item) return new Decimal(0);

    const totalQtyResult = await manager.createQueryBuilder(Stock, 'stock')
      .where('stock.itemId = :itemId', { itemId })
      .select('SUM(stock.quantity)', 'total')
      .getRawOne();
    
    const currentTotalQty = new Decimal(totalQtyResult?.total || 0);
    const currentMAC = new Decimal(item.movingAverageCost || 0);

    const currentTotalValue = currentTotalQty.mul(currentMAC);
    const inTotalValue = inQty.mul(inUnitCost);
    const newTotalQty = currentTotalQty.add(inQty);
    
    let newMAC = currentMAC;
    if (newTotalQty.gt(0)) {
       newMAC = currentTotalValue.add(inTotalValue).div(newTotalQty);
    } else if (inQty.gt(0)) {
       newMAC = inUnitCost;
    }

    item.movingAverageCost = newMAC;
    if (inUnitCost.gt(0)) {
      item.purchasePrice = inUnitCost;
    }
    item.updatedBy = userId || null;
    await manager.save(Item, item);

    return newMAC;
  }

  async syncItemTotalStock(itemIds: string[], manager: EntityManager): Promise<void> {
    if (!itemIds || itemIds.length === 0) return;
    const uniqueIds = Array.from(new Set(itemIds));

    await manager.query(`
      UPDATE items 
      SET total_stock = (
        SELECT IFNULL(SUM(quantity), 0) 
        FROM stocks 
        WHERE stocks.item_id = items.id
      )
      WHERE items.id IN (${uniqueIds.join(',')})
    `);
  }

  async decreaseStock(
    itemId: string, 
    departmentId: string, 
    quantity: number | Decimal, 
    manager: EntityManager = this.transactionContext.manager, 
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    const qty = new Decimal(quantity);

    let stock = await manager.findOne(Stock, {
      where: { itemId, departmentId },
      relations: ['item'],
      lock: { mode: 'pessimistic_write' }
    });

    if (!stock) {
      throw new BadRequestException(`Stok kaydı bulunamadı. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
    }

    StockMovementHelper.validateStockLimit(itemId, departmentId, new Decimal(stock.quantity), qty);

    const movement = StockMovementHelper.applyMovement({
      stock, quantity: qty, type: 'out', referenceInfo, userId, manager
    });

    await manager.save(Stock, stock);
    await manager.save(movement);
    await this.syncItemTotalStock([itemId], manager);
  }

  async decreaseStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager: EntityManager = this.transactionContext.manager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const reducedItems = new Map<string, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort();

    const stocks = await manager.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      relations: ['item'],
      lock: { mode: 'pessimistic_write' }
    });

    const movements: StockMovement[] = [];
    const stockMap = new Map<string, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      const stock = stockMap.get(itemId);

      if (!stock) {
        throw new BadRequestException(`Stok kaydı bulunamadı. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
      }

      StockMovementHelper.validateStockLimit(itemId, departmentId, new Decimal(stock.quantity), qty);

      const movement = StockMovementHelper.applyMovement({
        stock, quantity: qty, type: 'out', referenceInfo, userId, manager
      });
      movements.push(movement);
    }

    await manager.save(Stock, stocks);
    await manager.save(StockMovement, movements);
    await this.syncItemTotalStock(uniqueItemIds as string[], manager);
  }

  async reserveStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager: EntityManager = this.transactionContext.manager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const reducedItems = new Map<string, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort();

    const stocks = await manager.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    const stockMap = new Map<string, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    const movements: StockMovement[] = [];
    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      let stock = stockMap.get(itemId);

      if (!stock) {
        stock = manager.create(Stock, { itemId, departmentId, quantity: new Decimal(0), reservedQuantity: new Decimal(0) });
        stock = await manager.save(Stock, stock);
      }

      const qBefore = new Decimal(stock.quantity);
      stock.reservedQuantity = new Decimal(stock.reservedQuantity || 0).add(qty);
      stock.updatedBy = userId || null;

      if (!stocks.find((s: Stock) => s.id === stock!.id)) {
        stocks.push(stock!);
      }

      movements.push(manager.create(StockMovement, {
        stockId: stock.id,
        quantity: qty,
        quantityBefore: qBefore,
        quantityAfter: qBefore,
        type: 'out',
        referenceType: referenceInfo?.type || 'reserve',
        referenceId: referenceInfo?.id || null,
        description: referenceInfo?.description || 'Stok Rezervasyonu',
        createdBy: userId
      }));
    }

    await manager.save(Stock, stocks);
    await manager.save(StockMovement, movements);
  }

  async unreserveStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager: EntityManager = this.transactionContext.manager,
    userId?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const reducedItems = new Map<string, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort();

    const stocks = await manager.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    const stockMap = new Map<string, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      const stock = stockMap.get(itemId);

      if (stock) {
        stock.reservedQuantity = Decimal.max(0, new Decimal(stock.reservedQuantity || 0).sub(qty));
        stock.updatedBy = userId || null;
      }
    }

    await manager.save(Stock, stocks);
  }

  async finalizeShipmentBulk(
    items: Array<{ itemId: string; quantity: number | Decimal | string }>,
    departmentId: string,
    manager: EntityManager = this.transactionContext.manager,
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const reducedItems = new Map<string, Decimal>();
    for (const item of items) {
      const q = new Decimal(item.quantity);
      reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new Decimal(0)).add(q));
    }
    const uniqueItemIds = Array.from(reducedItems.keys()).sort();

    const stocks = await manager.find(Stock, {
      where: { itemId: In(uniqueItemIds), departmentId },
      relations: ['item'],
      lock: { mode: 'pessimistic_write' }
    });

    const stockMap = new Map<string, Stock>();
    stocks.forEach((s: Stock) => stockMap.set(s.itemId, s));

    const movements: StockMovement[] = [];

    for (const itemId of uniqueItemIds) {
      const qty = reducedItems.get(itemId)!;
      const stock = stockMap.get(itemId);

      if (!stock) {
        throw new BadRequestException(`Stok kaydı bulunamadı. Ürün ID: ${itemId}`);
      }

      StockMovementHelper.validateStockLimit(itemId, departmentId, new Decimal(stock.quantity), qty);

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = quantityBefore.sub(qty);

      stock.quantity = quantityAfter;
      stock.reservedQuantity = Decimal.max(0, new Decimal(stock.reservedQuantity || 0).sub(qty));
      stock.updatedBy = userId || null;

      const unitCost = new Decimal(stock.item?.movingAverageCost || 0);
      const totalCost = qty.mul(unitCost);

      movements.push(manager.create(StockMovement, {
        stockId: stock.id,
        quantity: qty,
        quantityBefore,
        quantityAfter,
        unitCost,
        totalCost,
        type: 'out',
        referenceType: referenceInfo?.type || 'shipment',
        referenceId: referenceInfo?.id || null,
        description: referenceInfo?.description || 'Sevkiyat Çıkışı',
        createdBy: userId
      }));
    }

    await manager.save(Stock, stocks);
    await manager.save(StockMovement, movements);
    await this.syncItemTotalStock(uniqueItemIds, manager);
  }

  async increaseStock(
    itemId: string, 
    departmentId: string, 
    quantity: number | Decimal, 
    inUnitCost: number | Decimal = 0,
    manager: EntityManager = this.transactionContext.manager, 
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string },
    userId?: string
  ): Promise<void> {
    const qty = new Decimal(quantity);
    const unitPrice = new Decimal(inUnitCost);

    const newMAC = await this.updateMovingAverageCost(manager, itemId, qty, unitPrice, userId || '');

    let stock = await manager.findOne(Stock, {
      where: { itemId, departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!stock) {
      stock = manager.create(Stock, {
        itemId, departmentId, quantity: new Decimal(0), reservedQuantity: new Decimal(0), createdBy: userId
      });
      stock = await manager.save(stock);
      stock = await manager.findOne(Stock, { where: { id: stock.id }, lock: { mode: 'pessimistic_write' } });
    }

    const movement = StockMovementHelper.applyMovement({
      stock: stock!, quantity: qty, type: 'in', referenceInfo, userId, manager
    });

    movement.unitCost = unitPrice.gt(0) ? unitPrice : newMAC;
    movement.totalCost = qty.mul(unitPrice.gt(0) ? unitPrice : newMAC);

    await manager.save(Stock, stock!);
    await manager.save(movement);
    await this.syncItemTotalStock([itemId], manager);
  }

  @Transactional()
  async adjustStock(dto: StockAdjustmentDto, userId: string): Promise<StockMovement> {
    const manager = this.transactionContext.manager;

    const item = await manager.findOne(Item, { where: { id: dto.itemId } });
    if (!item) throw new BadRequestException(`Ürün bulunamadı (ID: ${dto.itemId})`);

    const qty = new Decimal(dto.quantity);
    let unitCostToUse = new Decimal(dto.unitCost || 0);

    if (dto.type === 'in') {
      if (unitCostToUse.isZero()) {
        unitCostToUse = new Decimal(item.movingAverageCost || item.purchasePrice || 0);
      }
      await this.updateMovingAverageCost(manager, dto.itemId, qty, unitCostToUse, userId);
    } else {
      unitCostToUse = new Decimal(item.movingAverageCost || 0);
    }

    let stock = await manager.findOne(Stock, {
      where: { itemId: dto.itemId, departmentId: dto.departmentId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!stock) {
      stock = manager.create(Stock, {
        itemId: dto.itemId, departmentId: dto.departmentId, quantity: new Decimal(0), reservedQuantity: new Decimal(0), createdBy: userId,
      });
      stock = await manager.save(stock);
    }

    if (dto.type === 'out') {
      StockMovementHelper.validateStockLimit(dto.itemId, dto.departmentId, new Decimal(stock.quantity), qty);
    }

    const movement = StockMovementHelper.applyMovement({
      stock, quantity: qty, type: dto.type as 'in' | 'out', referenceInfo: { type: 'manual', id: '', description: dto.description || '' }, userId, manager
    });
    
    movement.notes = dto.notes ?? null;
    movement.unitCost = unitCostToUse;
    movement.totalCost = qty.mul(unitCostToUse);

    await manager.save(Stock, stock);
    const savedMovement = await manager.save(movement);

    await this.syncItemTotalStock([dto.itemId], manager);

    const totalCostValue = savedMovement.totalCost;

    if (!totalCostValue.isZero()) {
      const txType = dto.type === 'in' ? 'in' : 'out';
      const txPrefix = txType === 'in' ? 'SFG' : 'SFC';
      const txCode = await this.sequenceGenerator.generateTransactionCode(manager, txPrefix);

      await manager.save(manager.create(Transaction, {
        code: txCode,
        amount: totalCostValue,
        type: txType,
        date: DateUtils.getToday(),
        referenceType: 'manual_adjustment',
        referenceId: savedMovement.id,
        description: `Stok Ayarlaması Değer Kaydı: ${item.name}`,
        partyId: null, 
        status: 'completed',
        createdBy: userId,
      }));
    }

    this.logsService.logActivity({
      userId,
      module: 'inventory',
      action: 'STOCK_ADJUSTMENT',
      tag: dto.type === 'in' ? 'IN' : 'OUT',
      details: `Stok ayarlandı: Ürün ID ${dto.itemId}, Miktar: ${qty.toString()}, Birim Maliyet: ${unitCostToUse.toString()}`,
    });

    return savedMovement;
  }

  @Transactional()
  async transferStock(dto: TransferStockDto, userId: string) {
    if (dto.fromDepartmentId === dto.toDepartmentId) {
      throw new BadRequestException('Kaynak depo ile Hedef depo aynı olamaz.');
    }

    const manager = this.transactionContext.manager;

    const sortedDeptIds = [dto.fromDepartmentId, dto.toDepartmentId].sort();
    const stocks: Record<string, Stock> = {};

    for (const deptId of sortedDeptIds) {
      let s = await manager.findOne(Stock, {
        where: { itemId: dto.itemId, departmentId: deptId },
        relations: ['item'],
        lock: { mode: 'pessimistic_write' }
      });

      if (!s) {
        s = manager.create(Stock, { 
          itemId: dto.itemId, departmentId: deptId, quantity: new Decimal(0), reservedQuantity: new Decimal(0), createdBy: userId 
        });
        s = await manager.save(s);
        s = await manager.findOne(Stock, {
          where: { id: s.id },
          relations: ['item'],
          lock: { mode: 'pessimistic_write' }
        });
      }
      stocks[deptId] = s!;
    }

    const sourceStock = stocks[dto.fromDepartmentId];
    const targetStock = stocks[dto.toDepartmentId];
    const qty = new Decimal(dto.quantity);

    StockMovementHelper.validateStockLimit(dto.itemId, dto.fromDepartmentId, new Decimal(sourceStock.quantity), qty);

    const sourceMovement = StockMovementHelper.applyMovement({
      stock: sourceStock, quantity: qty, type: 'out', referenceInfo: { type: 'transfer', id: '', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId}` }, userId, manager
    });

    const targetMovement = StockMovementHelper.applyMovement({
      stock: targetStock, quantity: qty, type: 'in', referenceInfo: { type: 'transfer', id: '', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId}` }, userId, manager
    });

    // Make unit costs same
    const unitCost = new Decimal(sourceStock.item?.movingAverageCost || 0);
    const totalCost = qty.mul(unitCost);
    sourceMovement.unitCost = unitCost;
    sourceMovement.totalCost = totalCost;
    targetMovement.unitCost = unitCost;
    targetMovement.totalCost = totalCost;

    await manager.save(Stock, [sourceStock, targetStock]);
    await manager.save(StockMovement, [sourceMovement, targetMovement]);

    this.logsService.logActivity({
      userId,
      module: 'inventory',
      action: 'STOCK_TRANSFER',
      tag: 'TRANSFER',
      details: `Stok transfer edildi: Ürün ID ${dto.itemId}, Miktar: ${qty.toString()}, Değer: ${totalCost.toString()}`,
    });

    return { success: true, message: 'Transfer başarıyla gerçekleşti.' };
  }

  async revertStockMovementsByReference(
    referenceType: StockMovement['referenceType'],
    referenceId: string,
    manager: EntityManager = this.transactionContext.manager,
    userId: string
  ): Promise<void> {
    const movements = await manager.find(StockMovement, {
      where: { referenceType, referenceId },
      relations: ['stock']
    });

    if (movements.length === 0) return;

    const stockChanges = new Map<string, { stock: Stock; totalDelta: Decimal }>();

    for (const mov of movements) {
      const stock = mov.stock;
      if (!stock) continue;

      const delta = mov.type === 'out' 
        ? new Decimal(mov.quantity)
        : new Decimal(mov.quantity).negated();

      if (stockChanges.has(stock.id)) {
        const entry = stockChanges.get(stock.id)!;
        entry.totalDelta = entry.totalDelta.add(delta);
      } else {
        stockChanges.set(stock.id, { stock, totalDelta: delta });
      }
    }

    const sortedStockIds = Array.from(stockChanges.keys()).sort();
    
    const lockedStocks = await manager.find(Stock, {
      where: { id: In(sortedStockIds) },
      lock: { mode: 'pessimistic_write' }
    });

    const lockedStockMap = new Map<string, Stock>();
    lockedStocks.forEach((s: Stock) => lockedStockMap.set(s.id, s));

    const newMovements: StockMovement[] = [];
    const stocksToUpload: Stock[] = [];

    for (const stockId of sortedStockIds) {
      const change = stockChanges.get(stockId)!;
      const stock = lockedStockMap.get(stockId);
      
      if (!stock) continue;

      StockMovementHelper.validateStockLimit(stock.itemId, stock.departmentId, new Decimal(stock.quantity), change.totalDelta.negated());

      const movement = StockMovementHelper.applyMovement({
        stock, quantity: change.totalDelta.abs(), type: change.totalDelta.gt(0) ? 'in' : 'out', 
        referenceInfo: { type: 'revert', id: referenceId, description: `İşlem İptali Revert: ${referenceType} ID ${referenceId}` }, userId, manager
      });

      movement.unitCost = new Decimal(0);
      movement.totalCost = new Decimal(0);

      stocksToUpload.push(stock);
      newMovements.push(movement);
    }

    await manager.save(Stock, stocksToUpload);
    await manager.save(StockMovement, newMovements);

    const itemIdsToSync = stocksToUpload.map(s => s.itemId);
    await this.syncItemTotalStock(itemIdsToSync, manager);
  }
}
