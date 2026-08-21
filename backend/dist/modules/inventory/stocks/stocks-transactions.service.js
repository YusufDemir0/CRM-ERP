"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StocksTransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const stock_entity_1 = require("./entities/stock.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const inventory_dto_1 = require("../dto/inventory.dto");
const item_entity_1 = require("../items/entities/item.entity");
const transaction_entity_1 = require("../../finance/transactions/entities/transaction.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const date_utils_1 = require("../../../common/utils/date.utils");
const logs_service_1 = require("../../logs/logs.service");
const transactional_1 = require("@nestjs-cls/transactional");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const stock_movement_helper_1 = require("./domain/stock-movement.helper");
let StocksTransactionsService = StocksTransactionsService_1 = class StocksTransactionsService {
    constructor(stockRepo, movementRepo, dataSource, sequenceGenerator, logsService, transactionContext) {
        this.stockRepo = stockRepo;
        this.movementRepo = movementRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.logsService = logsService;
        this.transactionContext = transactionContext;
        this.logger = new common_1.Logger(StocksTransactionsService_1.name);
    }
    async updateMovingAverageCost(manager, itemId, inQty, inUnitCost, userId) {
        const item = await manager.findOne(item_entity_1.Item, {
            where: { id: itemId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!item)
            return new decimal_js_1.Decimal(0);
        const totalQtyResult = await manager.createQueryBuilder(stock_entity_1.Stock, 'stock')
            .where('stock.itemId = :itemId', { itemId })
            .select('SUM(stock.quantity)', 'total')
            .getRawOne();
        const currentTotalQty = new decimal_js_1.Decimal(totalQtyResult?.total || 0);
        const currentMAC = new decimal_js_1.Decimal(item.movingAverageCost || 0);
        const currentTotalValue = currentTotalQty.mul(currentMAC);
        const inTotalValue = inQty.mul(inUnitCost);
        const newTotalQty = currentTotalQty.add(inQty);
        let newMAC = currentMAC;
        if (newTotalQty.gt(0)) {
            newMAC = currentTotalValue.add(inTotalValue).div(newTotalQty);
        }
        else if (inQty.gt(0)) {
            newMAC = inUnitCost;
        }
        item.movingAverageCost = newMAC;
        if (inUnitCost.gt(0)) {
            item.purchasePrice = inUnitCost;
        }
        item.updatedBy = userId || null;
        await manager.save(item_entity_1.Item, item);
        return newMAC;
    }
    async syncItemTotalStock(itemIds, manager) {
        if (!itemIds || itemIds.length === 0)
            return;
        const uniqueIds = Array.from(new Set(itemIds));
        const placeholders = uniqueIds.map(() => '?').join(',');
        await manager.query(`
      UPDATE items 
      SET total_stock = (
        SELECT IFNULL(SUM(quantity), 0) 
        FROM stocks 
        WHERE stocks.item_id = items.id
      )
      WHERE items.id IN (${placeholders})
    `, uniqueIds);
    }
    async decreaseStock(itemId, departmentId, quantity, manager = this.transactionContext.manager, referenceInfo, userId) {
        const qty = new decimal_js_1.Decimal(quantity);
        let stock = await manager.findOne(stock_entity_1.Stock, {
            where: { itemId, departmentId },
            relations: ['item'],
            lock: { mode: 'pessimistic_write' }
        });
        if (!stock) {
            throw new common_1.BadRequestException(`Stok kaydı bulunamadı. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
        }
        stock_movement_helper_1.StockMovementHelper.validateStockLimit(itemId, departmentId, new decimal_js_1.Decimal(stock.quantity), qty);
        const movement = stock_movement_helper_1.StockMovementHelper.applyMovement({
            stock, quantity: qty, type: 'out', referenceInfo, userId, manager
        });
        await manager.save(stock_entity_1.Stock, stock);
        await manager.save(movement);
        await this.syncItemTotalStock([itemId], manager);
    }
    async decreaseStockBulk(items, departmentId, manager = this.transactionContext.manager, referenceInfo, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort();
        const stocks = await manager.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            relations: ['item'],
            lock: { mode: 'pessimistic_write' }
        });
        const movements = [];
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            const stock = stockMap.get(itemId);
            if (!stock) {
                throw new common_1.BadRequestException(`Stok kaydı bulunamadı. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
            }
            stock_movement_helper_1.StockMovementHelper.validateStockLimit(itemId, departmentId, new decimal_js_1.Decimal(stock.quantity), qty);
            const movement = stock_movement_helper_1.StockMovementHelper.applyMovement({
                stock, quantity: qty, type: 'out', referenceInfo, userId, manager
            });
            movements.push(movement);
        }
        await manager.save(stock_entity_1.Stock, stocks);
        await manager.save(stock_movement_entity_1.StockMovement, movements);
        await this.syncItemTotalStock(uniqueItemIds, manager);
    }
    async reserveStockBulk(items, departmentId, manager = this.transactionContext.manager, referenceInfo, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort();
        for (const itemId of uniqueItemIds) {
            await manager.query(`INSERT INTO \`stocks\` (\`item_id\`, \`department_id\`, \`quantity\`, \`reserved_quantity\`, \`state\`)
         VALUES (?, ?, 0, 0, 1)
         ON DUPLICATE KEY UPDATE \`item_id\` = \`item_id\``, [itemId, departmentId]);
        }
        const stocks = await manager.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        const movements = [];
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            const stock = stockMap.get(itemId);
            const qBefore = new decimal_js_1.Decimal(stock.quantity);
            stock.reservedQuantity = new decimal_js_1.Decimal(stock.reservedQuantity || 0).add(qty);
            stock.updatedBy = userId || null;
            movements.push(manager.create(stock_movement_entity_1.StockMovement, {
                stockId: stock.id,
                quantity: qty,
                quantityBefore: qBefore,
                quantityAfter: qBefore,
                type: 'out',
                referenceType: referenceInfo?.type || 'lock',
                referenceId: referenceInfo?.id || null,
                description: referenceInfo?.description || 'Stok Rezervasyonu',
                createdBy: userId
            }));
        }
        await manager.save(stock_entity_1.Stock, stocks);
        await manager.save(stock_movement_entity_1.StockMovement, movements);
    }
    async unreserveStockBulk(items, departmentId, manager = this.transactionContext.manager, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort();
        const stocks = await manager.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            const stock = stockMap.get(itemId);
            if (stock) {
                stock.reservedQuantity = decimal_js_1.Decimal.max(0, new decimal_js_1.Decimal(stock.reservedQuantity || 0).sub(qty));
                stock.updatedBy = userId || null;
            }
        }
        await manager.save(stock_entity_1.Stock, stocks);
    }
    async releaseStockBulk(items, departmentId, manager = this.transactionContext.manager, referenceInfo, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort();
        const stocks = await manager.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        const movements = [];
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            const stock = stockMap.get(itemId);
            if (stock) {
                const qBefore = new decimal_js_1.Decimal(stock.quantity);
                stock.reservedQuantity = decimal_js_1.Decimal.max(0, new decimal_js_1.Decimal(stock.reservedQuantity || 0).sub(qty));
                stock.updatedBy = userId || null;
                movements.push(manager.create(stock_movement_entity_1.StockMovement, {
                    stockId: stock.id,
                    quantity: qty,
                    quantityBefore: qBefore,
                    quantityAfter: qBefore,
                    type: 'in',
                    referenceType: referenceInfo?.type || 'revert',
                    referenceId: referenceInfo?.id || null,
                    description: referenceInfo?.description || 'Rezervasyon İptali',
                    createdBy: userId
                }));
            }
        }
        await manager.save(stock_entity_1.Stock, stocks);
        if (movements.length > 0) {
            await manager.save(stock_movement_entity_1.StockMovement, movements);
        }
    }
    async finalizeShipmentBulk(items, departmentId, manager = this.transactionContext.manager, referenceInfo, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort();
        const stocks = await manager.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            relations: ['item'],
            lock: { mode: 'pessimistic_write' }
        });
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        const movements = [];
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            let stock = stockMap.get(itemId);
            if (!stock) {
                stock = manager.create(stock_entity_1.Stock, {
                    itemId,
                    departmentId,
                    quantity: new decimal_js_1.Decimal(0),
                    reservedQuantity: new decimal_js_1.Decimal(0),
                    createdBy: userId || null
                });
                stock = await manager.save(stock_entity_1.Stock, stock);
                stock = await manager.findOne(stock_entity_1.Stock, {
                    where: { id: stock.id },
                    relations: ['item'],
                    lock: { mode: 'pessimistic_write' }
                });
                if (!stock) {
                    throw new common_1.BadRequestException(`Stok kaydı oluşturulamadı. Ürün ID: ${itemId}`);
                }
            }
            stock_movement_helper_1.StockMovementHelper.validateStockLimit(itemId, departmentId, new decimal_js_1.Decimal(stock.quantity), qty);
            const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
            const quantityAfter = quantityBefore.sub(qty);
            stock.quantity = quantityAfter;
            stock.reservedQuantity = decimal_js_1.Decimal.max(0, new decimal_js_1.Decimal(stock.reservedQuantity || 0).sub(qty));
            stock.updatedBy = userId || null;
            const unitCost = new decimal_js_1.Decimal(stock.item?.movingAverageCost || 0);
            const totalCost = qty.mul(unitCost);
            movements.push(manager.create(stock_movement_entity_1.StockMovement, {
                stockId: stock.id,
                quantity: qty,
                quantityBefore,
                quantityAfter,
                unitCost,
                totalCost,
                type: 'out',
                referenceType: referenceInfo?.type || 'deduct',
                referenceId: referenceInfo?.id || null,
                description: referenceInfo?.description || 'Sevkiyat Çıkışı',
                createdBy: userId
            }));
        }
        await manager.save(stock_entity_1.Stock, stocks);
        await manager.save(stock_movement_entity_1.StockMovement, movements);
        await this.syncItemTotalStock(uniqueItemIds, manager);
    }
    async increaseStock(itemId, departmentId, quantity, inUnitCost = 0, manager = this.transactionContext.manager, referenceInfo, userId) {
        const qty = new decimal_js_1.Decimal(quantity);
        const unitPrice = new decimal_js_1.Decimal(inUnitCost);
        const newMAC = await this.updateMovingAverageCost(manager, itemId, qty, unitPrice, userId || '');
        let stock = await manager.findOne(stock_entity_1.Stock, {
            where: { itemId, departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!stock) {
            stock = manager.create(stock_entity_1.Stock, {
                itemId, departmentId, quantity: new decimal_js_1.Decimal(0), reservedQuantity: new decimal_js_1.Decimal(0), createdBy: userId
            });
            stock = await manager.save(stock);
            stock = await manager.findOne(stock_entity_1.Stock, { where: { id: stock.id }, lock: { mode: 'pessimistic_write' } });
        }
        const movement = stock_movement_helper_1.StockMovementHelper.applyMovement({
            stock: stock, quantity: qty, type: 'in', referenceInfo, userId, manager
        });
        movement.unitCost = unitPrice.gt(0) ? unitPrice : newMAC;
        movement.totalCost = qty.mul(unitPrice.gt(0) ? unitPrice : newMAC);
        await manager.save(stock_entity_1.Stock, stock);
        await manager.save(movement);
        await this.syncItemTotalStock([itemId], manager);
    }
    async adjustStock(dto, userId) {
        const manager = this.transactionContext.manager;
        const item = await manager.findOne(item_entity_1.Item, { where: { id: dto.itemId } });
        if (!item)
            throw new common_1.BadRequestException(`Ürün bulunamadı (ID: ${dto.itemId})`);
        const qty = new decimal_js_1.Decimal(dto.quantity);
        let unitCostToUse = new decimal_js_1.Decimal(dto.unitCost || 0);
        if (dto.type === 'in') {
            if (unitCostToUse.isZero()) {
                unitCostToUse = new decimal_js_1.Decimal(item.movingAverageCost || item.purchasePrice || 0);
            }
            await this.updateMovingAverageCost(manager, dto.itemId, qty, unitCostToUse, userId);
        }
        else {
            unitCostToUse = new decimal_js_1.Decimal(item.movingAverageCost || 0);
        }
        let stock = await manager.findOne(stock_entity_1.Stock, {
            where: { itemId: dto.itemId, departmentId: dto.departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!stock) {
            stock = manager.create(stock_entity_1.Stock, {
                itemId: dto.itemId, departmentId: dto.departmentId, quantity: new decimal_js_1.Decimal(0), reservedQuantity: new decimal_js_1.Decimal(0), createdBy: userId,
            });
            stock = await manager.save(stock);
        }
        if (dto.type === 'out') {
            stock_movement_helper_1.StockMovementHelper.validateStockLimit(dto.itemId, dto.departmentId, new decimal_js_1.Decimal(stock.quantity), qty);
        }
        const movement = stock_movement_helper_1.StockMovementHelper.applyMovement({
            stock, quantity: qty, type: dto.type, referenceInfo: { type: 'manual', id: '', description: dto.description || '' }, userId, manager
        });
        movement.notes = dto.notes ?? null;
        movement.unitCost = unitCostToUse;
        movement.totalCost = qty.mul(unitCostToUse);
        await manager.save(stock_entity_1.Stock, stock);
        const savedMovement = await manager.save(movement);
        await this.syncItemTotalStock([dto.itemId], manager);
        const totalCostValue = savedMovement.totalCost;
        if (!totalCostValue.isZero()) {
            const txType = dto.type === 'in' ? 'in' : 'out';
            const txPrefix = txType === 'in' ? 'SFG' : 'SFC';
            const txCode = await this.sequenceGenerator.generateTransactionCode(manager, txPrefix);
            await manager.save(manager.create(transaction_entity_1.Transaction, {
                code: txCode,
                amount: totalCostValue,
                type: txType,
                date: date_utils_1.DateUtils.getToday(),
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
    async transferStock(dto, userId) {
        if (dto.fromDepartmentId === dto.toDepartmentId) {
            throw new common_1.BadRequestException('Kaynak depo ile Hedef depo aynı olamaz.');
        }
        const manager = this.transactionContext.manager;
        const sortedDeptIds = [dto.fromDepartmentId, dto.toDepartmentId].sort();
        const stocks = {};
        for (const deptId of sortedDeptIds) {
            let s = await manager.findOne(stock_entity_1.Stock, {
                where: { itemId: dto.itemId, departmentId: deptId },
                relations: ['item'],
                lock: { mode: 'pessimistic_write' }
            });
            if (!s) {
                s = manager.create(stock_entity_1.Stock, {
                    itemId: dto.itemId, departmentId: deptId, quantity: new decimal_js_1.Decimal(0), reservedQuantity: new decimal_js_1.Decimal(0), createdBy: userId
                });
                s = await manager.save(s);
                s = await manager.findOne(stock_entity_1.Stock, {
                    where: { id: s.id },
                    relations: ['item'],
                    lock: { mode: 'pessimistic_write' }
                });
            }
            stocks[deptId] = s;
        }
        const sourceStock = stocks[dto.fromDepartmentId];
        const targetStock = stocks[dto.toDepartmentId];
        const qty = new decimal_js_1.Decimal(dto.quantity);
        stock_movement_helper_1.StockMovementHelper.validateStockLimit(dto.itemId, dto.fromDepartmentId, new decimal_js_1.Decimal(sourceStock.quantity), qty);
        const sourceMovement = stock_movement_helper_1.StockMovementHelper.applyMovement({
            stock: sourceStock, quantity: qty, type: 'out', referenceInfo: { type: 'transfer', id: '', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId}` }, userId, manager
        });
        const targetMovement = stock_movement_helper_1.StockMovementHelper.applyMovement({
            stock: targetStock, quantity: qty, type: 'in', referenceInfo: { type: 'transfer', id: '', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId}` }, userId, manager
        });
        const unitCost = new decimal_js_1.Decimal(sourceStock.item?.movingAverageCost || 0);
        const totalCost = qty.mul(unitCost);
        sourceMovement.unitCost = unitCost;
        sourceMovement.totalCost = totalCost;
        targetMovement.unitCost = unitCost;
        targetMovement.totalCost = totalCost;
        await manager.save(stock_entity_1.Stock, [sourceStock, targetStock]);
        await manager.save(stock_movement_entity_1.StockMovement, [sourceMovement, targetMovement]);
        this.logsService.logActivity({
            userId,
            module: 'inventory',
            action: 'STOCK_TRANSFER',
            tag: 'TRANSFER',
            details: `Stok transfer edildi: Ürün ID ${dto.itemId}, Miktar: ${qty.toString()}, Değer: ${totalCost.toString()}`,
        });
        return { success: true, message: 'Transfer başarıyla gerçekleşti.' };
    }
    async revertStockMovementsByReference(referenceType, referenceId, manager = this.transactionContext.manager, userId) {
        const movements = await manager.find(stock_movement_entity_1.StockMovement, {
            where: { referenceType, referenceId },
            relations: ['stock']
        });
        if (movements.length === 0)
            return;
        const stockChanges = new Map();
        for (const mov of movements) {
            const stock = mov.stock;
            if (!stock)
                continue;
            const delta = mov.type === 'out'
                ? new decimal_js_1.Decimal(mov.quantity)
                : new decimal_js_1.Decimal(mov.quantity).negated();
            if (stockChanges.has(stock.id)) {
                const entry = stockChanges.get(stock.id);
                entry.totalDelta = entry.totalDelta.add(delta);
            }
            else {
                stockChanges.set(stock.id, { stock, totalDelta: delta });
            }
        }
        const sortedStockIds = Array.from(stockChanges.keys()).sort();
        const lockedStocks = await manager.find(stock_entity_1.Stock, {
            where: { id: (0, typeorm_2.In)(sortedStockIds) },
            lock: { mode: 'pessimistic_write' }
        });
        const lockedStockMap = new Map();
        lockedStocks.forEach((s) => lockedStockMap.set(s.id, s));
        const newMovements = [];
        const stocksToUpload = [];
        for (const stockId of sortedStockIds) {
            const change = stockChanges.get(stockId);
            const stock = lockedStockMap.get(stockId);
            if (!stock)
                continue;
            stock_movement_helper_1.StockMovementHelper.validateStockLimit(stock.itemId, stock.departmentId, new decimal_js_1.Decimal(stock.quantity), change.totalDelta.negated());
            const movement = stock_movement_helper_1.StockMovementHelper.applyMovement({
                stock, quantity: change.totalDelta.abs(), type: change.totalDelta.gt(0) ? 'in' : 'out',
                referenceInfo: { type: 'revert', id: referenceId, description: `İşlem İptali Revert: ${referenceType} ID ${referenceId}` }, userId, manager
            });
            movement.unitCost = new decimal_js_1.Decimal(0);
            movement.totalCost = new decimal_js_1.Decimal(0);
            stocksToUpload.push(stock);
            newMovements.push(movement);
        }
        await manager.save(stock_entity_1.Stock, stocksToUpload);
        await manager.save(stock_movement_entity_1.StockMovement, newMovements);
        const itemIdsToSync = stocksToUpload.map(s => s.itemId);
        await this.syncItemTotalStock(itemIdsToSync, manager);
    }
};
exports.StocksTransactionsService = StocksTransactionsService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StockAdjustmentDto, String]),
    __metadata("design:returntype", Promise)
], StocksTransactionsService.prototype, "adjustStock", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.TransferStockDto, String]),
    __metadata("design:returntype", Promise)
], StocksTransactionsService.prototype, "transferStock", null);
exports.StocksTransactionsService = StocksTransactionsService = StocksTransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        logs_service_1.LogsService,
        transaction_context_service_1.TransactionContextService])
], StocksTransactionsService);
//# sourceMappingURL=stocks-transactions.service.js.map