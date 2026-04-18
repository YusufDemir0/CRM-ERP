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
exports.InventoryOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const item_entity_1 = require("./items/entities/item.entity");
const stock_entity_1 = require("./stocks/entities/stock.entity");
const bom_item_entity_1 = require("../production/entities/bom-item.entity");
const decimal_js_1 = require("decimal.js");
const items_service_1 = require("./items/items.service");
let InventoryOrchestratorService = class InventoryOrchestratorService {
    constructor(itemRepo, stockRepo, bomItemRepo, dataSource, itemsService) {
        this.itemRepo = itemRepo;
        this.stockRepo = stockRepo;
        this.bomItemRepo = bomItemRepo;
        this.dataSource = dataSource;
        this.itemsService = itemsService;
    }
    async safeDelete(id, userId) {
        await this.validateUsage(id);
        await this.itemsService.softDelete(id, userId);
    }
    async safeUpdateState(id, newState, userId) {
        if (newState === 0) {
            await this.validateUsage(id);
        }
        await this.itemsService.update(id, { state: newState }, userId);
    }
    async validateUsage(id) {
        const totalStock = await this.stockRepo.createQueryBuilder('stock')
            .where('stock.itemId = :id', { id })
            .select('SUM(stock.quantity)', 'sum')
            .getRawOne();
        if (totalStock && totalStock.sum && new decimal_js_1.Decimal(totalStock.sum).gt(0)) {
            throw new common_1.BadRequestException(`Stokta ${totalStock.sum} adet bulunan ürün pasife alınamaz/silinemez. Lütfen önce stokları sıfırlayınız.`);
        }
        const usageCount = await this.bomItemRepo.count({ where: { itemId: id } });
        if (usageCount > 0) {
            throw new common_1.BadRequestException(`Bu ürün ${usageCount} farklı reçetede (BOM) kullanılmaktadır. Önce reçetelerden çıkarılmalıdır.`);
        }
    }
};
exports.InventoryOrchestratorService = InventoryOrchestratorService;
exports.InventoryOrchestratorService = InventoryOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __param(2, (0, typeorm_1.InjectRepository)(bom_item_entity_1.BomItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        items_service_1.ItemsService])
], InventoryOrchestratorService);
//# sourceMappingURL=inventory-orchestrator.service.js.map