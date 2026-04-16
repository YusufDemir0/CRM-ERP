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
const item_entity_1 = require("../items/entities/item.entity");
const transaction_entity_1 = require("../../finance/transactions/entities/transaction.entity");
const party_entity_1 = require("../../parties/entities/party.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const date_utils_1 = require("../../../common/utils/date.utils");
const finance_helper_1 = require("../../../common/utils/finance.helper");
const logs_service_1 = require("../../logs/logs.service");
let StocksService = class StocksService {
    constructor(stockRepo, movementRepo, dataSource, sequenceGenerator, logsService) {
        this.stockRepo = stockRepo;
        this.movementRepo = movementRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.logsService = logsService;
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
            qb.andWhere('(item.name LIKE :s OR item.code LIKE :s)', { s: `%${query.search}%` });
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
    async decreaseStock(itemId, departmentId, quantity, manager, referenceInfo, userId) {
        const qr = manager || this.dataSource.manager;
        const qty = new decimal_js_1.Decimal(quantity);
        let stock = await qr.findOne(stock_entity_1.Stock, {
            where: { itemId, departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!stock || new decimal_js_1.Decimal(stock.quantity).lt(qty)) {
            throw new common_1.BadRequestException(`Yetersiz stok. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
        }
        const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
        const quantityAfter = finance_helper_1.FinanceHelper.sub(quantityBefore, qty);
        stock.quantity = quantityAfter;
        stock.updatedBy = userId || null;
        await qr.save(stock_entity_1.Stock, stock);
        await qr.save(qr.create(stock_movement_entity_1.StockMovement, {
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
    async decreaseStockBulk(items, departmentId, manager, referenceInfo, userId) {
        const qr = manager || this.dataSource.manager;
        if (!items || items.length === 0)
            return;
        const itemIds = items.map(i => i.itemId);
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
        const stocks = await qr.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        const movements = [];
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            const stock = stockMap.get(itemId);
            if (!stock || new decimal_js_1.Decimal(stock.quantity).lt(qty)) {
                throw new common_1.BadRequestException(`Yetersiz stok. (Ürün ID: ${itemId}, Depo ID: ${departmentId})`);
            }
            const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
            const quantityAfter = finance_helper_1.FinanceHelper.sub(quantityBefore, qty);
            stock.quantity = quantityAfter;
            stock.updatedBy = userId || null;
            movements.push(qr.create(stock_movement_entity_1.StockMovement, {
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
        await qr.save(stock_entity_1.Stock, stocks);
        await qr.save(stock_movement_entity_1.StockMovement, movements);
    }
    async reserveStockBulk(items, departmentId, manager, userId) {
        const qr = manager || this.dataSource.manager;
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
        const stocks = await qr.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        const stockMap = new Map();
        stocks.forEach((s) => stockMap.set(s.itemId, s));
        for (const itemId of uniqueItemIds) {
            const qty = reducedItems.get(itemId);
            let stock = stockMap.get(itemId);
            if (!stock) {
                stock = qr.create(stock_entity_1.Stock, { itemId, departmentId, quantity: new decimal_js_1.Decimal(0), reservedQuantity: new decimal_js_1.Decimal(0) });
                stock = await qr.save(stock_entity_1.Stock, stock);
            }
            if (!stock)
                continue;
            if (new decimal_js_1.Decimal(stock.quantity).lt(new decimal_js_1.Decimal(stock.reservedQuantity || 0).add(qty))) {
            }
            stock.reservedQuantity = new decimal_js_1.Decimal(stock.reservedQuantity || 0).add(qty);
            stock.updatedBy = userId || null;
            if (!stocks.find((s) => s.id === stock.id)) {
                stocks.push(stock);
            }
        }
        await qr.save(stock_entity_1.Stock, stocks);
    }
    async unreserveStockBulk(items, departmentId, manager, userId) {
        const qr = manager || this.dataSource.manager;
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
        const stocks = await qr.find(stock_entity_1.Stock, {
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
        await qr.save(stock_entity_1.Stock, stocks);
    }
    async finalizeShipmentBulk(items, departmentId, manager, referenceInfo, userId) {
        const qr = manager || this.dataSource.manager;
        if (!items || items.length === 0)
            return;
        const reducedItems = new Map();
        for (const item of items) {
            const q = new decimal_js_1.Decimal(item.quantity);
            reducedItems.set(item.itemId, (reducedItems.get(item.itemId) || new decimal_js_1.Decimal(0)).add(q));
        }
        const uniqueItemIds = Array.from(reducedItems.keys()).sort((a, b) => a - b);
        const stocks = await qr.find(stock_entity_1.Stock, {
            where: { itemId: (0, typeorm_2.In)(uniqueItemIds), departmentId },
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
            movements.push(qr.create(stock_movement_entity_1.StockMovement, {
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
        await qr.save(stock_entity_1.Stock, stocks);
        await qr.save(stock_movement_entity_1.StockMovement, movements);
    }
    async increaseStock(itemId, departmentId, quantity, manager, referenceInfo, userId) {
        const qr = manager || this.dataSource.manager;
        const qty = new decimal_js_1.Decimal(quantity);
        let stock = await qr.findOne(stock_entity_1.Stock, {
            where: { itemId, departmentId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!stock) {
            stock = qr.create(stock_entity_1.Stock, {
                itemId, departmentId, quantity: new decimal_js_1.Decimal(0), createdBy: userId
            });
            stock = await qr.save(stock);
            stock = await qr.findOne(stock_entity_1.Stock, { where: { id: stock.id }, lock: { mode: 'pessimistic_write' } });
        }
        const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
        const quantityAfter = finance_helper_1.FinanceHelper.add(quantityBefore, qty);
        stock.quantity = quantityAfter;
        stock.updatedBy = userId || null;
        await qr.save(stock_entity_1.Stock, stock);
        await qr.save(qr.create(stock_movement_entity_1.StockMovement, {
            stockId: stock.id,
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
    async adjustStock(dto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let stock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                where: { itemId: dto.itemId, departmentId: dto.departmentId },
                lock: { mode: 'pessimistic_write' }
            });
            if (!stock) {
                stock = queryRunner.manager.create(stock_entity_1.Stock, {
                    itemId: dto.itemId, departmentId: dto.departmentId, quantity: new decimal_js_1.Decimal(0), createdBy: userId,
                });
                stock = await queryRunner.manager.save(stock);
            }
            const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
            let quantityAfter;
            if (dto.type === 'in') {
                quantityAfter = finance_helper_1.FinanceHelper.add(quantityBefore, dto.quantity);
            }
            else {
                if (quantityBefore.lt(dto.quantity)) {
                    throw new common_1.BadRequestException(`Yetersiz stok. Mevcut: ${quantityBefore.toString()}, İstenen: ${dto.quantity}`);
                }
                quantityAfter = finance_helper_1.FinanceHelper.sub(quantityBefore, dto.quantity);
            }
            const sign = dto.type === 'in' ? '+' : '-';
            stock.quantity = quantityAfter;
            stock.updatedBy = userId || null;
            await queryRunner.manager.save(stock_entity_1.Stock, stock);
            const movement = queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                stockId: stock.id, quantity: dto.quantity, quantityBefore, quantityAfter,
                type: dto.type, referenceType: 'manual', description: dto.description, notes: dto.notes, createdBy: userId,
            });
            const savedMovement = await queryRunner.manager.save(movement);
            const item = await queryRunner.manager.findOne(item_entity_1.Item, { where: { id: dto.itemId } });
            if (item) {
                const totalCostValue = finance_helper_1.FinanceHelper.mul(item.purchasePrice || 0, dto.quantity);
                if (!new decimal_js_1.Decimal(totalCostValue).isZero()) {
                    const txType = dto.type === 'in' ? 'in' : 'out';
                    const txPrefix = txType === 'in' ? 'SFG' : 'SFC';
                    const txCode = await this.sequenceGenerator.generateTransactionCode(queryRunner, txPrefix);
                    let internalParty = await queryRunner.manager.findOne(party_entity_1.Party, { where: { taxNumber: 'INTERNAL' } });
                    if (!internalParty) {
                        internalParty = queryRunner.manager.create(party_entity_1.Party, {
                            name: 'ERMAY İÇ TRANSFER / MERKEZ',
                            taxNumber: 'INTERNAL',
                            type: 'both',
                            balance: new decimal_js_1.Decimal(0),
                            createdBy: userId
                        });
                        internalParty = await queryRunner.manager.save(internalParty);
                    }
                    const partyId = internalParty.id;
                    const transaction = queryRunner.manager.create(transaction_entity_1.Transaction, {
                        code: txCode,
                        amount: totalCostValue,
                        type: txType,
                        date: date_utils_1.DateUtils.getToday(),
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
            this.logsService.logActivity({
                userId,
                module: 'inventory',
                action: 'STOCK_ADJUSTMENT',
                tag: dto.type === 'in' ? 'IN' : 'OUT',
                details: `Stok ayarlandı: Ürün ID ${dto.itemId}, Miktar: ${dto.type === 'in' ? '+' : '-'}${dto.quantity}`,
            });
            return savedMovement;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async transferStock(dto, userId) {
        if (dto.fromDepartmentId === dto.toDepartmentId) {
            throw new common_1.BadRequestException('Kaynak depo ile Hedef depo aynı olamaz.');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sortedDeptIds = [dto.fromDepartmentId, dto.toDepartmentId].sort((a, b) => a - b);
            const stocks = {};
            for (const deptId of sortedDeptIds) {
                let s = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                    where: { itemId: dto.itemId, departmentId: deptId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (!s) {
                    s = queryRunner.manager.create(stock_entity_1.Stock, {
                        itemId: dto.itemId, departmentId: deptId, quantity: new decimal_js_1.Decimal(0), createdBy: userId
                    });
                    s = await queryRunner.manager.save(s);
                    s = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                        where: { id: s.id },
                        lock: { mode: 'pessimistic_write' }
                    });
                }
                stocks[deptId] = s;
            }
            const sourceStock = stocks[dto.fromDepartmentId];
            const targetStock = stocks[dto.toDepartmentId];
            if (new decimal_js_1.Decimal(sourceStock.quantity).lt(dto.quantity)) {
                throw new common_1.BadRequestException(`Kaynak depoda yeterli stok bulunmuyor. Mevcut: ${sourceStock.quantity.toString()}`);
            }
            const sourceQtyBefore = new decimal_js_1.Decimal(sourceStock.quantity);
            const sourceQtyAfter = finance_helper_1.FinanceHelper.sub(sourceQtyBefore, dto.quantity);
            const targetQtyBefore = new decimal_js_1.Decimal(targetStock.quantity);
            const targetQtyAfter = finance_helper_1.FinanceHelper.add(targetQtyBefore, dto.quantity);
            sourceStock.quantity = sourceQtyAfter;
            sourceStock.updatedBy = userId || null;
            await queryRunner.manager.save(stock_entity_1.Stock, sourceStock);
            await queryRunner.manager.save(queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                stockId: sourceStock.id, quantity: dto.quantity, quantityBefore: sourceQtyBefore, quantityAfter: sourceQtyAfter,
                type: 'out', referenceType: 'adjustment', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
            }));
            targetStock.quantity = targetQtyAfter;
            targetStock.updatedBy = userId || null;
            await queryRunner.manager.save(stock_entity_1.Stock, targetStock);
            await queryRunner.manager.save(queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                stockId: targetStock.id, quantity: dto.quantity, quantityBefore: targetQtyBefore, quantityAfter: targetQtyAfter,
                type: 'in', referenceType: 'adjustment', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
            }));
            await queryRunner.commitTransaction();
            this.logsService.logActivity({
                userId,
                module: 'inventory',
                action: 'STOCK_TRANSFER',
                tag: 'TRANSFER',
                details: `Stok transfer edildi: Ürün ID ${dto.itemId}, Kaynak: ${dto.fromDepartmentId}, Hedef: ${dto.toDepartmentId}, Miktar: ${dto.quantity}`,
            });
            return { success: true, message: 'Transfer başarıyla gerçekleşti.' };
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
    }
    async revertStockMovementsByReference(referenceType, referenceId, manager, userId) {
        const qr = manager;
        const movements = await qr.find(stock_movement_entity_1.StockMovement, {
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
        const lockedStocks = await qr.find(stock_entity_1.Stock, {
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
                throw new common_1.BadRequestException(`İşlem geri alınırken stok yetersiz kalıyor. (Stok ID: ${stockId})`);
            }
            stock.quantity = quantityAfter;
            stock.updatedBy = userId || null;
            stocksToUpload.push(stock);
            newMovements.push(qr.create(stock_movement_entity_1.StockMovement, {
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
        await qr.save(stock_entity_1.Stock, stocksToUpload);
        await qr.save(stock_movement_entity_1.StockMovement, newMovements);
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
            totalQuantity: Number(total.quantity || 0),
            criticalCount: Number(critical.count || 0),
        };
    }
};
exports.StocksService = StocksService;
exports.StocksService = StocksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        logs_service_1.LogsService])
], StocksService);
//# sourceMappingURL=stocks.service.js.map