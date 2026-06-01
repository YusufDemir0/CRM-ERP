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
var StocksReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_entity_1 = require("./entities/stock.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const sql_helper_1 = require("../../../common/utils/sql.helper");
const decimal_js_1 = require("decimal.js");
let StocksReportsService = StocksReportsService_1 = class StocksReportsService {
    constructor(stockRepo, movementRepo) {
        this.stockRepo = stockRepo;
        this.movementRepo = movementRepo;
        this.logger = new common_1.Logger(StocksReportsService_1.name);
    }
    async findAll(query) {
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
        if (query.departmentId)
            qb.andWhere('stock.departmentId = :deptId', { deptId: query.departmentId });
        if (query.itemId)
            qb.andWhere('stock.itemId = :itemId', { itemId: query.itemId });
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(item.name LIKE :s OR item.code LIKE :s)', { s });
        }
        if (query.state !== undefined) {
            qb.andWhere('item.state = :state', { state: query.state });
        }
        if (query.isCritical === 'true') {
            qb.andWhere('stock.quantity <= item.criticalLimit AND item.criticalLimit > 0');
        }
        const sortFieldMap = {
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
    async findAllMovements(query) {
        const qb = this.movementRepo.createQueryBuilder('sm')
            .leftJoin('sm.stock', 'stock')
            .leftJoin('stock.item', 'item')
            .leftJoin('stock.department', 'department')
            .select([
            'sm.id', 'sm.quantity', 'sm.type', 'sm.referenceType', 'sm.referenceId', 'sm.createdAt', 'sm.notes',
            'sm.quantityBefore', 'sm.quantityAfter', 'sm.unitCost', 'sm.totalCost',
            'stock.id', 'stock.quantity',
            'item.id', 'item.code', 'item.name',
            'department.id', 'department.name'
        ])
            .orderBy('sm.createdAt', 'DESC');
        if (query.type) {
            qb.andWhere('sm.type = :type', { type: query.type });
        }
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(item.name LIKE :s OR item.code LIKE :s OR sm.description LIKE :s)', { s });
        }
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
    async getCriticalStocks(query) {
        const qb = this.stockRepo.createQueryBuilder('stock')
            .leftJoin('stock.item', 'item')
            .leftJoin('stock.department', 'department')
            .select([
            'stock.id', 'stock.quantity',
            'item.id', 'item.name', 'item.code', 'item.criticalLimit',
            'department.id', 'department.name'
        ])
            .where('stock.quantity <= item.criticalLimit')
            .andWhere('item.criticalLimit > 0')
            .orderBy('stock.quantity', 'ASC')
            .skip(query.skip)
            .take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async getStockReport() {
        const qb = this.stockRepo.createQueryBuilder('stock')
            .leftJoin('stock.item', 'item')
            .select('SUM(stock.quantity * item.movingAverageCost)', 'totalValue')
            .addSelect('COUNT(DISTINCT stock.itemId)', 'totalItems');
        return await qb.getRawOne();
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
            totalQuantity: new decimal_js_1.Decimal(total.quantity || 0).toFixed(2),
            criticalCount: Number(critical.count || 0),
        };
    }
};
exports.StocksReportsService = StocksReportsService;
exports.StocksReportsService = StocksReportsService = StocksReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StocksReportsService);
//# sourceMappingURL=stocks-reports.service.js.map