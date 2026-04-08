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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_entity_1 = require("./entities/stock.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
let StocksService = class StocksService {
    constructor(stockRepo, movementRepo, dataSource) {
        this.stockRepo = stockRepo;
        this.movementRepo = movementRepo;
        this.dataSource = dataSource;
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
        qb.orderBy('stock.quantity', 'DESC');
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
    async adjustStock(dto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let stock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                where: { itemId: dto.itemId, departmentId: dto.departmentId },
            });
            if (!stock) {
                stock = queryRunner.manager.create(stock_entity_1.Stock, {
                    itemId: dto.itemId, departmentId: dto.departmentId, quantity: 0, createdBy: userId,
                });
                stock = await queryRunner.manager.save(stock);
            }
            const quantityBefore = Number(stock.quantity);
            let quantityAfter;
            if (dto.type === 'in') {
                quantityAfter = quantityBefore + dto.quantity;
            }
            else {
                if (quantityBefore < dto.quantity) {
                    throw new common_1.BadRequestException(`Yetersiz stok. Mevcut: ${quantityBefore}, İstenen: ${dto.quantity}`);
                }
                quantityAfter = quantityBefore - dto.quantity;
            }
            await queryRunner.manager.update(stock_entity_1.Stock, stock.id, { quantity: quantityAfter, updatedBy: userId });
            const movement = queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                stockId: stock.id, quantity: dto.quantity, quantityBefore, quantityAfter,
                type: dto.type, referenceType: 'manual', description: dto.description, notes: dto.notes, createdBy: userId,
            });
            const savedMovement = await queryRunner.manager.save(movement);
            await queryRunner.commitTransaction();
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
            const sourceStock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                where: { itemId: dto.itemId, departmentId: dto.fromDepartmentId }
            });
            if (!sourceStock || Number(sourceStock.quantity) < dto.quantity) {
                throw new common_1.BadRequestException(`Kaynak depoda yeterli stok bulunmuyor. Mevcut: ${sourceStock ? sourceStock.quantity : 0}`);
            }
            const sourceQtyBefore = Number(sourceStock.quantity);
            const sourceQtyAfter = sourceQtyBefore - dto.quantity;
            await queryRunner.manager.update(stock_entity_1.Stock, sourceStock.id, { quantity: sourceQtyAfter, updatedBy: userId });
            await queryRunner.manager.save(queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                stockId: sourceStock.id, quantity: dto.quantity, quantityBefore: sourceQtyBefore, quantityAfter: sourceQtyAfter,
                type: 'out', referenceType: 'adjustment', description: `Transfer Çıkışı -> HEDEF DEPO ID: ${dto.toDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
            }));
            let targetStock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                where: { itemId: dto.itemId, departmentId: dto.toDepartmentId }
            });
            if (!targetStock) {
                targetStock = queryRunner.manager.create(stock_entity_1.Stock, {
                    itemId: dto.itemId, departmentId: dto.toDepartmentId, quantity: 0, createdBy: userId
                });
                targetStock = await queryRunner.manager.save(targetStock);
            }
            const targetQtyBefore = Number(targetStock.quantity);
            const targetQtyAfter = targetQtyBefore + dto.quantity;
            await queryRunner.manager.update(stock_entity_1.Stock, targetStock.id, { quantity: targetQtyAfter, updatedBy: userId });
            await queryRunner.manager.save(queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                stockId: targetStock.id, quantity: dto.quantity, quantityBefore: targetQtyBefore, quantityAfter: targetQtyAfter,
                type: 'in', referenceType: 'adjustment', description: `Transfer Girişi <- KAYNAK DEPO ID: ${dto.fromDepartmentId} | Not: ${dto.description || ''}`, createdBy: userId
            }));
            await queryRunner.commitTransaction();
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
        typeorm_2.DataSource])
], StocksService);
//# sourceMappingURL=stocks.service.js.map