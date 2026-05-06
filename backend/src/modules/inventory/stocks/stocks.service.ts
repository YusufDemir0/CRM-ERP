import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Decimal } from 'decimal.js';

dayjs.extend(utc);
dayjs.extend(timezone);

import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginatedResult, PaginationDto } from '../../../common/dto/pagination.dto';
import { Item } from '../items/entities/item.entity';
import { Transaction } from '../../finance/transactions/entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { FinanceHelper } from '../../../common/utils/finance.helper';
import { LogsService } from '../../logs/logs.service';
import { Transactional } from '@nestjs-cls/transactional';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private logsService: LogsService,
    private transactionContext: TransactionContextService,
  ) {}

  async findAll(query: StocksQueryDto): Promise<PaginatedResult<Stock>> {
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

    if (query.departmentId) qb.andWhere('stock.departmentId = :deptId', { deptId: query.departmentId });
    if (query.itemId) qb.andWhere('stock.itemId = :itemId', { itemId: query.itemId });
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

  private validateStock(itemId: string, deptId: string, currentQty: Decimal, delta: Decimal) {
    const margin = new Decimal(-100);
    const after = currentQty.sub(delta);
    if (after.lt(margin)) {
      throw new BadRequestException(
        `Yetersiz stok! En fazla -100 birime kadar izin verilmektedir. (Ürün ID: ${itemId}, Depo ID: ${deptId}, Mevcut: ${currentQty.toString()}, Talep: ${delta.toString()}, Kalan: ${after.toString()})`
      );
    }
  }

  async findAllMovements(query: PaginationDto & { type?: string; search?: string }): Promise<PaginatedResult<StockMovement>> {
    const qb = this.movementRepo.createQueryBuilder('sm')
      .leftJoinAndSelect('sm.stock', 'stock')
      .leftJoinAndSelect('stock.item', 'item')
      .leftJoinAndSelect('stock.department', 'department')
      .orderBy('sm.createdAt', 'DESC');

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

  async getMovements(stockId: string, query: PaginationDto): Promise<PaginatedResult<StockMovement>> {
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

    this.validateStock(itemId, departmentId, new Decimal(stock.quantity), qty);

    const quantityBefore = new Decimal(stock.quantity);
    const quantityAfter = FinanceHelper.sub(quantityBefore, qty);

    stock.quantity = quantityAfter;
    stock.updatedBy = userId || null;
    await manager.save(Stock, stock);

    const unitCost = new Decimal(stock.item?.movingAverageCost || 0);
    const totalCost = qty.mul(unitCost);

    await manager.save(manager.create(StockMovement, {
      stockId: stock.id,
      quantity: qty,
      quantityBefore,
      quantityAfter,
      unitCost,
      totalCost,
      type: 'out',
      referenceType: referenceInfo?.type || 'manual',
      referenceId: referenceInfo?.id || null,
      description: referenceInfo?.description || 'Stok Çıkışı',
      createdBy: userId
    }));

    await this.syncItemTotalStock([itemId], manager);
  }

  async decreaseStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal }>,
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

      this.validateStock(itemId, departmentId, new Decimal(stock.quantity), qty);

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = FinanceHelper.sub(quantityBefore, qty);
      
      stock.quantity = quantityAfter;
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
        referenceType: referenceInfo?.type || 'manual',
        referenceId: referenceInfo?.id || null,
        description: referenceInfo?.description || 'Stok Çıkışı',
        createdBy: userId
      }));
    }

    await manager.save(Stock, stocks);
    await manager.save(StockMovement, movements);

    await this.syncItemTotalStock(uniqueItemIds as string[], manager);
  }

  async reserveStockBulk(
    items: Array<{ itemId: string; quantity: number | Decimal }>,
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
        quantityAfter: qBefore, // Quantity doesn't change during reservation
        type: 'out', // Reservation is a potential 'out'
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
    items: Array<{ itemId: string; quantity: number | Decimal }>,
    departmentId: string,
    manager: EntityManager = this.transactionContext.manager,
    userId: string
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
    items: Array<{ itemId: string; quantity: number | Decimal }>,
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

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = quantityBefore.sub(qty);

      if (quantityAfter.lt(-100)) {
        throw new BadRequestException(`Sevkiyat için yetersiz stok limitleri aşıldı (-100 sınırı). Ürün ID: ${itemId}`);
      }

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

    const quantityBefore = new Decimal(stock!.quantity);
    const quantityAfter = FinanceHelper.add(quantityBefore, qty);

    stock!.quantity = quantityAfter;
    stock!.updatedBy = userId || null;
    await manager.save(Stock, stock!);

    await manager.save(manager.create(StockMovement, {
      stockId: stock!.id,
      quantity: qty,
      quantityBefore,
      quantityAfter,
      unitCost: unitPrice.gt(0) ? unitPrice : newMAC,
      totalCost: qty.mul(unitPrice.gt(0) ? unitPrice : newMAC),
      type: 'in',
      referenceType: referenceInfo?.type || 'manual',
      referenceId: referenceInfo?.id || null,
      description: referenceInfo?.description || 'Stok Girişi',
      createdBy: userId
    }));

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

    const quantityBefore = new Decimal(stock.quantity);
    let quantityAfter: Decimal;

    if (dto.type === 'in') {
      quantityAfter = FinanceHelper.add(quantityBefore, qty);
    } else {
      quantityAfter = FinanceHelper.sub(quantityBefore, qty);
      if (quantityAfter.lt(-100)) {
        throw new BadRequestException(`Yetersiz stok limitleri aşıldı (-100 sınırı). Mevcut: ${quantityBefore.toString()}`);
      }
    }

    stock.quantity = quantityAfter;
    stock.updatedBy = userId || null;
    await manager.save(Stock, stock);

    const movement = manager.create(StockMovement, {
      stockId: stock.id,
      quantity: qty,
      quantityBefore,
      quantityAfter,
      unitCost: unitCostToUse,
      totalCost: qty.mul(unitCostToUse),
      type: dto.type,
      referenceType: 'manual',
      description: dto.description,
      notes: dto.notes,
      createdBy: userId,
    });

    const savedMovement = await manager.save(movement);

    await this.syncItemTotalStock([dto.itemId], manager);

    const totalCostValue = savedMovement.totalCost;

    if (!totalCostValue.isZero()) {
      const txType = dto.type === 'in' ? 'in' : 'out';
      const txPrefix = txType === 'in' ? 'SFG' : 'SFC';
      const txCode = await this.sequenceGenerator.generateTransactionCode(manager, txPrefix);

      // Stock adjustment value entry — no phantom party needed.
      // These entries are self-referencing accounting records that track
      // the financial impact of inventory adjustments without polluting
      // the party ledger with fictitious balances.
      await manager.save(manager.create(Transaction, {
        code: txCode,
        amount: totalCostValue,
        type: txType,
        date: DateUtils.getToday(),
        referenceType: 'manual_adjustment',
        referenceId: savedMovement.id,
        description: `Stok Ayarlaması Değer Kaydı: ${item.name}`,
        partyId: null, // No phantom party — clean accounting
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
    const sourceQtyBefore = new Decimal(sourceStock.quantity);
    const sourceQtyAfter = FinanceHelper.sub(sourceQtyBefore, qty);
    
    if (sourceQtyAfter.lt(-100)) {
      throw new BadRequestException(`Kaynak depoda yeterli stok limiti bulunmuyor (-100 sınırı).`);
    }
    const targetQtyBefore = new Decimal(targetStock.quantity);
    const targetQtyAfter = FinanceHelper.add(targetQtyBefore, qty);

    const unitCost = new Decimal(sourceStock.item?.movingAverageCost || 0);
    const totalCost = qty.mul(unitCost);

    sourceStock.quantity = sourceQtyAfter;
    sourceStock.updatedBy = userId || null;
    await manager.save(Stock, sourceStock);

    await manager.save(manager.create(StockMovement, {
      stockId: sourceStock.id, 
      quantity: qty, 
      quantityBefore: sourceQtyBefore, 
      quantityAfter: sourceQtyAfter,
      unitCost,
      totalCost,
      type: 'out', 
      referenceType: 'transfer', 
      description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId}`, 
      createdBy: userId
    }));

    targetStock.quantity = targetQtyAfter;
    targetStock.updatedBy = userId || null;
    await manager.save(Stock, targetStock);

    await manager.save(manager.create(StockMovement, {
      stockId: targetStock.id, 
      quantity: qty, 
      quantityBefore: targetQtyBefore, 
      quantityAfter: targetQtyAfter,
      unitCost,
      totalCost,
      type: 'in', 
      referenceType: 'transfer', 
      description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId}`, 
      createdBy: userId
    }));

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

      const quantityBefore = new Decimal(stock.quantity);
      const quantityAfter = quantityBefore.add(change.totalDelta);

      if (quantityAfter.lt(-100)) {
        throw new BadRequestException(`İşlem geri alınırken stok limitleri yetersiz kalıyor (-100 sınırı).`);
      }

      stock.quantity = quantityAfter;
      stock.updatedBy = userId || null;
      stocksToUpload.push(stock);

      newMovements.push(manager.create(StockMovement, {
        stockId: stock.id,
        quantity: change.totalDelta.abs(),
        quantityBefore,
        quantityAfter,
        unitCost: new Decimal(0),
        totalCost: new Decimal(0),
        type: change.totalDelta.gt(0) ? 'in' : 'out',
        referenceType: 'revert',
        referenceId: referenceId,
        description: `İşlem İptali Revert: ${referenceType} ID ${referenceId}`,
        createdBy: userId
      }));
    }

    await manager.save(Stock, stocksToUpload);
    await manager.save(StockMovement, newMovements);

    const itemIdsToSync = stocksToUpload.map(s => s.itemId);
    await this.syncItemTotalStock(itemIdsToSync, manager);
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
      totalQuantity: new Decimal(total.quantity || 0).toFixed(2),
      criticalCount: Number(critical.count || 0),
    };
  }

  /**
   * Syncs the denormalized total_stock field in the items table.
   * This is called after stock operations to maintain data integrity
   * without the overhead of database subscribers during bulk operations.
   */
  private async syncItemTotalStock(itemIds: string[], manager: EntityManager): Promise<void> {
    if (!itemIds || itemIds.length === 0) return;
    const uniqueIds = Array.from(new Set(itemIds));

    // SEC-02: Optimized bulk update using subquery (MySQL compatible)
    // This avoids N+1 queries by updating all items in a single statement.
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
}