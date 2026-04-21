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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const decimal_js_1 = require("decimal.js");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const stock_entity_1 = require("./entities/stock.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const inventory_dto_1 = require("../dto/inventory.dto");
const item_entity_1 = require("../items/entities/item.entity");
const transaction_entity_1 = require("../../finance/transactions/entities/transaction.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const date_utils_1 = require("../../../common/utils/date.utils");
const finance_helper_1 = require("../../../common/utils/finance.helper");
const logs_service_1 = require("../../logs/logs.service");
const transactional_decorator_1 = require("../../../common/decorators/transactional.decorator");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const sql_helper_1 = require("../../../common/utils/sql.helper");
let StocksService = class StocksService {
    constructor(stockRepo, movementRepo, dataSource, sequenceGenerator, logsService, transactionContext) {
        this.stockRepo = stockRepo;
        this.movementRepo = movementRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.logsService = logsService;
        this.transactionContext = transactionContext;
    }
    async findAll(query) {
        const qb = this.stockRepo.createQueryBuilder('stock')
            .leftJoinAndSelect('stock.item', 'item')
            .leftJoinAndSelect('item.itemType', 'itemType')
            .leftJoinAndSelect('item.quantityType', 'quantityType')
            .leftJoinAndSelect('stock.department', 'department');
        if (query.departmentId)
            qb.andWhere('stock.departmentId = :deptId', { deptId: query.departmentId });
        if (query.itemId)
            qb.andWhere('stock.itemId = :itemId', { itemId: query.itemId });
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(item.name LIKE :s OR item.code LIKE :s)', { s });
        }
        if (query.isCritical === 'true') {
            qb.andWhere('stock.quantity <= item.criticalLimit');
            qb.andWhere('item.criticalLimit > 0');
        }
        const allowedSortCols = ['quantity', 'createdAt', 'item.name', 'department.name'];
        const sortField = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'quantity';
        const finalSortField = sortField.includes('.') ? sortField : `stock.${sortField}`;
        qb.orderBy(finalSortField, query.sortOrder || 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
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
    validateStock(itemId, deptId, currentQty, delta) {
        if (currentQty.lt(delta)) {
            throw new common_1.BadRequestException(`Stok negatife düşemez! (Ürün ID: ${itemId}, Depo ID: ${deptId}, Mevcut: ${currentQty.toString()}, Talep Edilen: ${delta.toString()})`);
        }
    }
    async getMovements(stockId, query) {
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
        this.validateStock(itemId, departmentId, new decimal_js_1.Decimal(stock.quantity), qty);
        const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
        const quantityAfter = finance_helper_1.FinanceHelper.sub(quantityBefore, qty);
        stock.quantity = quantityAfter;
        stock.updatedBy = userId || null;
        await manager.save(stock_entity_1.Stock, stock);
        const unitCost = new decimal_js_1.Decimal(stock.item?.movingAverageCost || 0);
        const totalCost = qty.mul(unitCost);
        await manager.save(manager.create(stock_movement_entity_1.StockMovement, {
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
    async decreaseStockBulk(items, departmentId, manager = this.transactionContext.manager, referenceInfo, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
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
            this.validateStock(itemId, departmentId, new decimal_js_1.Decimal(stock.quantity), qty);
            const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
            const quantityAfter = finance_helper_1.FinanceHelper.sub(quantityBefore, qty);
            stock.quantity = quantityAfter;
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
                referenceType: referenceInfo?.type || 'manual',
                referenceId: referenceInfo?.id || null,
                description: referenceInfo?.description || 'Stok Çıkışı',
                createdBy: userId
            }));
        }
        await manager.save(stock_entity_1.Stock, stocks);
        await manager.save(stock_movement_entity_1.StockMovement, movements);
    }
    async reserveStockBulk(items, departmentId, manager = this.transactionContext.manager, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
        const stocks = await manager.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            let stock = stockMap.get(itemId);
            if (!stock) {
                stock = manager.create(stock_entity_1.Stock, { itemId, departmentId, quantity: new decimal_js_1.Decimal(0), reservedQuantity: new decimal_js_1.Decimal(0) });
                stock = await manager.save(stock_entity_1.Stock, stock);
            }
            stock.reservedQuantity = new decimal_js_1.Decimal(stock.reservedQuantity || 0).add(qty);
            stock.updatedBy = userId || null;
            if (!stocks.find((s) => s.id === stock.id)) {
                stocks.push(stock);
            }
        }
        await manager.save(stock_entity_1.Stock, stocks);
    }
    async unreserveStockBulk(items, departmentId, manager = this.transactionContext.manager, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
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
    async finalizeShipmentBulk(items, departmentId, manager = this.transactionContext.manager, referenceInfo, userId) {
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
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
            const stock = stockMap.get(itemId);
            if (!stock || new decimal_js_1.Decimal(stock.quantity).lt(qty)) {
                throw new common_1.BadRequestException(`Sevkiyat için yetersiz fiziksel stok. Ürün ID: ${itemId}`);
            }
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
                referenceType: referenceInfo?.type || 'shipment',
                referenceId: referenceInfo?.id || null,
                description: referenceInfo?.description || 'Sevkiyat Çıkışı',
                createdBy: userId
            }));
        }
        await manager.save(stock_entity_1.Stock, stocks);
        await manager.save(stock_movement_entity_1.StockMovement, movements);
    }
    async increaseStock(itemId, departmentId, quantity, inUnitCost = 0, manager = this.transactionContext.manager, referenceInfo, userId) {
        const qty = new decimal_js_1.Decimal(quantity);
        const unitPrice = new decimal_js_1.Decimal(inUnitCost);
        const newMAC = await this.updateMovingAverageCost(manager, itemId, qty, unitPrice, userId);
        let stock = await manager.findOne(stock_entity_1.Stock, {
            where: { itemId, departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!stock) {
            stock = manager.create(stock_entity_1.Stock, {
                itemId, departmentId, quantity: new decimal_js_1.Decimal(0), createdBy: userId
            });
            stock = await manager.save(stock);
            stock = await manager.findOne(stock_entity_1.Stock, { where: { id: stock.id }, lock: { mode: 'pessimistic_write' } });
        }
        const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
        const quantityAfter = finance_helper_1.FinanceHelper.add(quantityBefore, qty);
        stock.quantity = quantityAfter;
        stock.updatedBy = userId || null;
        await manager.save(stock_entity_1.Stock, stock);
        await manager.save(manager.create(stock_movement_entity_1.StockMovement, {
            stockId: stock.id,
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
                itemId: dto.itemId, departmentId: dto.departmentId, quantity: new decimal_js_1.Decimal(0), createdBy: userId,
            });
            stock = await manager.save(stock);
        }
        const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
        let quantityAfter;
        if (dto.type === 'in') {
            quantityAfter = finance_helper_1.FinanceHelper.add(quantityBefore, qty);
        }
        else {
            if (quantityBefore.lt(qty)) {
                throw new common_1.BadRequestException(`Yetersiz stok. Mevcut: ${quantityBefore.toString()}`);
            }
            quantityAfter = finance_helper_1.FinanceHelper.sub(quantityBefore, qty);
        }
        stock.quantity = quantityAfter;
        stock.updatedBy = userId || null;
        await manager.save(stock_entity_1.Stock, stock);
        const movement = manager.create(stock_movement_entity_1.StockMovement, {
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
        const totalCostValue = savedMovement.totalCost;
        if (!totalCostValue.isZero()) {
            const txType = dto.type === 'in' ? 'in' : 'out';
            const txPrefix = txType === 'in' ? 'SFG' : 'SFC';
            const txCode = await this.sequenceGenerator.generateTransactionCode(manager, txPrefix);
            let internalParty = await manager.findOne(party_entity_1.Party, { where: { taxNumber: 'INTERNAL' } });
            if (!internalParty) {
                internalParty = manager.create(party_entity_1.Party, {
                    name: 'ERMAY İÇ TRANSFER / MERKEZ',
                    taxNumber: 'INTERNAL',
                    type: 'both',
                    balance: new decimal_js_1.Decimal(0),
                    createdBy: userId
                });
                internalParty = await manager.save(internalParty);
            }
            await manager.save(manager.create(transaction_entity_1.Transaction, {
                code: txCode,
                amount: totalCostValue,
                type: txType,
                date: date_utils_1.DateUtils.getToday(),
                referenceType: 'manual_adjustment',
                referenceId: savedMovement.id,
                description: `Stok Ayarlaması Değer Kaydı: ${item.name}`,
                partyId: internalParty.id,
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
        const sortedDeptIds = [dto.fromDepartmentId, dto.toDepartmentId].sort((a, b) => a - b);
        const stocks = {};
        for (const deptId of sortedDeptIds) {
            let s = await manager.findOne(stock_entity_1.Stock, {
                where: { itemId: dto.itemId, departmentId: deptId },
                relations: ['item'],
                lock: { mode: 'pessimistic_write' }
            });
            if (!s) {
                s = manager.create(stock_entity_1.Stock, {
                    itemId: dto.itemId, departmentId: deptId, quantity: new decimal_js_1.Decimal(0), createdBy: userId
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
        if (new decimal_js_1.Decimal(sourceStock.quantity).lt(dto.quantity)) {
            throw new common_1.BadRequestException(`Kaynak depoda yeterli stok bulunmuyor.`);
        }
        const qty = new decimal_js_1.Decimal(dto.quantity);
        const sourceQtyBefore = new decimal_js_1.Decimal(sourceStock.quantity);
        const sourceQtyAfter = finance_helper_1.FinanceHelper.sub(sourceQtyBefore, qty);
        const targetQtyBefore = new decimal_js_1.Decimal(targetStock.quantity);
        const targetQtyAfter = finance_helper_1.FinanceHelper.add(targetQtyBefore, qty);
        const unitCost = new decimal_js_1.Decimal(sourceStock.item?.movingAverageCost || 0);
        const totalCost = qty.mul(unitCost);
        sourceStock.quantity = sourceQtyAfter;
        sourceStock.updatedBy = userId || null;
        await manager.save(stock_entity_1.Stock, sourceStock);
        await manager.save(manager.create(stock_movement_entity_1.StockMovement, {
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
        await manager.save(stock_entity_1.Stock, targetStock);
        await manager.save(manager.create(stock_movement_entity_1.StockMovement, {
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
        const sortedStockIds = Array.from(stockChanges.keys()).sort((a, b) => a - b);
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
            const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
            const quantityAfter = quantityBefore.add(change.totalDelta);
            if (quantityAfter.lt(0)) {
                throw new common_1.BadRequestException(`İşlem geri alınırken stok yetersiz kalıyor.`);
            }
            stock.quantity = quantityAfter;
            stock.updatedBy = userId || null;
            stocksToUpload.push(stock);
            newMovements.push(manager.create(stock_movement_entity_1.StockMovement, {
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
        await manager.save(stock_entity_1.Stock, stocksToUpload);
        await manager.save(stock_movement_entity_1.StockMovement, newMovements);
    }
    async getCriticalStocks() {
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
            totalQuantity: new decimal_js_1.Decimal(total.quantity || 0).toNumber(),
            criticalCount: Number(critical.count || 0),
        };
    }
};
exports.StocksService = StocksService;
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StockAdjustmentDto, Number]),
    __metadata("design:returntype", Promise)
], StocksService.prototype, "adjustStock", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.TransferStockDto, Number]),
    __metadata("design:returntype", Promise)
], StocksService.prototype, "transferStock", null);
exports.StocksService = StocksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        logs_service_1.LogsService,
        transaction_context_service_1.TransactionContextService])
], StocksService);
//# sourceMappingURL=stocks.service.js.map