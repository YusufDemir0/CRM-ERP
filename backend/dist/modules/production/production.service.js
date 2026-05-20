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
var ProductionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionService = void 0;
const common_1 = require("@nestjs/common");
const stocks_service_1 = require("../inventory/stocks/stocks.service");
const items_service_1 = require("../inventory/items/items.service");
const logs_service_1 = require("../logs/logs.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bom_entity_1 = require("./entities/bom.entity");
const bom_item_entity_1 = require("./entities/bom-item.entity");
const production_order_entity_1 = require("./entities/production-order.entity");
const item_entity_1 = require("../inventory/items/entities/item.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
const production_dto_1 = require("./dto/production.dto");
const finance_helper_1 = require("../../common/utils/finance.helper");
const date_utils_1 = require("../../common/utils/date.utils");
const decimal_js_1 = require("decimal.js");
const transactional_1 = require("@nestjs-cls/transactional");
const transaction_context_service_1 = require("../../common/services/transaction-context.service");
const sql_helper_1 = require("../../common/utils/sql.helper");
let ProductionService = ProductionService_1 = class ProductionService {
    constructor(bomRepo, bomItemRepo, poRepo, itemRepo, dataSource, sequenceGenerator, stocksService, itemsService, logsService, transactionContext) {
        this.bomRepo = bomRepo;
        this.bomItemRepo = bomItemRepo;
        this.poRepo = poRepo;
        this.itemRepo = itemRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.stocksService = stocksService;
        this.itemsService = itemsService;
        this.logsService = logsService;
        this.transactionContext = transactionContext;
        this.logger = new common_1.Logger(ProductionService_1.name);
    }
    async findAllBoms(query) {
        const qb = this.bomRepo.createQueryBuilder('bom')
            .leftJoin('bom.targetItem', 'targetItem')
            .select([
            'bom.id', 'bom.name', 'bom.version', 'bom.isActive', 'bom.state', 'bom.createdAt',
            'targetItem.id', 'targetItem.name', 'targetItem.code'
        ])
            .addSelect(subQuery => {
            return subQuery
                .select('COUNT(*)', 'count')
                .from(bom_item_entity_1.BomItem, 'bi')
                .where('bi.bomId = bom.id');
        }, 'bom_itemCount');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(bom.name LIKE :s OR targetItem.name LIKE :s OR targetItem.code LIKE :s)', { s });
        }
        if (query.state !== undefined) {
            qb.andWhere('bom.state = :state', { state: query.state });
        }
        const sortFieldMap = {
            'name': 'bom.name',
            'createdAt': 'bom.createdAt',
            'version': 'bom.version'
        };
        const sortCol = sortFieldMap[query.sortBy || ''] || 'bom.createdAt';
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
    async findOneBom(id) {
        const bom = await this.transactionContext.manager.findOne(bom_entity_1.Bom, {
            where: { id },
            relations: ['items', 'items.item', 'targetItem'],
        });
        if (!bom)
            throw new common_1.NotFoundException('Reçete (BOM) bulunamadı');
        return bom;
    }
    async createBom(dto, userId) {
        const manager = this.transactionContext.manager;
        let version = 1;
        if (dto.targetItemId) {
            const lastBom = await manager.findOne(bom_entity_1.Bom, {
                where: { targetItemId: dto.targetItemId },
                order: { version: 'DESC' },
            });
            if (lastBom)
                version = lastBom.version + 1;
            await manager.update(bom_entity_1.Bom, { targetItemId: dto.targetItemId, isActive: true }, { isActive: false });
        }
        const materialItemIds = [];
        if (dto.items.length > 0) {
            const itemIdsToFetch = dto.items.map(i => i.itemId);
            const items = await manager.find(item_entity_1.Item, { where: { id: (0, typeorm_2.In)(itemIdsToFetch) } });
            const itemMap = new Map(items.map(i => [i.id, i]));
            for (const itemDto of dto.items) {
                if (dto.targetItemId && String(itemDto.itemId) === String(dto.targetItemId)) {
                    throw new common_1.BadRequestException('Üretilecek ürünün kendisi, reçete içeriğinde yer alamaz!');
                }
                const item = itemMap.get(itemDto.itemId);
                if (!item || item.state !== 1) {
                    throw new common_1.BadRequestException(`Ürün bulunamadı veya pasif (ID: ${itemDto.itemId}).`);
                }
                materialItemIds.push(itemDto.itemId);
            }
        }
        if (dto.targetItemId) {
            const hasCycle = await this.detectBomCycle(dto.targetItemId, materialItemIds, manager);
            if (hasCycle) {
                throw new common_1.BadRequestException('Döngüsel reçete tespit edildi! Malzemelerden biri doğrudan veya dolaylı olarak üretilecek ürüne bağlı.');
            }
        }
        const bom = manager.create(bom_entity_1.Bom, {
            name: dto.name,
            description: dto.description ?? undefined,
            targetItemId: dto.targetItemId ?? undefined,
            version,
            isActive: true,
            createdBy: userId,
        });
        const savedBom = await manager.save(bom);
        const bomItemsToCreate = dto.items.map(itemDto => manager.create(bom_item_entity_1.BomItem, {
            bomId: savedBom.id,
            itemId: itemDto.itemId,
            quantity: new decimal_js_1.Decimal(itemDto.quantity),
            description: itemDto.description ?? '',
            createdBy: userId,
        }));
        if (bomItemsToCreate.length > 0) {
            await manager.save(bom_item_entity_1.BomItem, bomItemsToCreate);
        }
        return this.findOneBom(savedBom.id);
    }
    async detectBomCycle(targetItemId, materialItemIds, manager) {
        const allActiveBoms = await manager.find(bom_entity_1.Bom, {
            where: { isActive: true },
            relations: ['items'],
        });
        const bomMap = new Map();
        for (const bom of allActiveBoms) {
            if (bom.targetItemId) {
                const materialIds = (bom.items || []).map(bi => bi.itemId);
                bomMap.set(String(bom.targetItemId), materialIds);
            }
        }
        const visited = new Set();
        const stack = [...materialItemIds];
        while (stack.length > 0) {
            const currentId = stack.pop();
            if (String(currentId) === String(targetItemId))
                return true;
            if (visited.has(currentId))
                continue;
            visited.add(currentId);
            const children = bomMap.get(currentId) || [];
            for (const childId of children) {
                if (!visited.has(childId)) {
                    stack.push(childId);
                }
            }
        }
        return false;
    }
    async updateBom(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const bom = await this.findOneBom(id);
        if (dto.items && dto.items.length > 0) {
            await manager.update(bom_entity_1.Bom, id, { isActive: false, updatedBy: userId });
            return this.createBom({
                name: dto.name ?? bom.name,
                description: dto.description ?? bom.description ?? undefined,
                targetItemId: dto.targetItemId ?? bom.targetItemId ?? undefined,
                items: dto.items,
            }, userId);
        }
        if (dto.name !== undefined)
            bom.name = dto.name;
        if (dto.description !== undefined)
            bom.description = dto.description;
        if (dto.targetItemId !== undefined)
            bom.targetItemId = dto.targetItemId;
        if (dto.state !== undefined)
            bom.state = dto.state;
        bom.updatedBy = userId || null;
        await manager.save(bom);
        return this.findOneBom(id);
    }
    async deleteBom(id) {
        const poCount = await this.poRepo.count({ where: { bomId: id } });
        if (poCount > 0) {
            throw new common_1.BadRequestException(`Bu reçete ${poCount} adet üretim emrinde kullanılmaktadır.`);
        }
        await this.bomRepo.softDelete(id);
    }
    async findAllOrders(query) {
        const qb = this.poRepo.createQueryBuilder('po')
            .leftJoin('po.bom', 'bom')
            .leftJoin('po.sourceDepartment', 'sourceDept')
            .leftJoin('po.targetDepartment', 'targetDept')
            .select([
            'po.id', 'po.code', 'po.plannedQuantity', 'po.producedQuantity',
            'po.status', 'po.startDate', 'po.endDate', 'po.createdAt',
            'bom.id', 'bom.name',
            'sourceDept.id', 'sourceDept.name',
            'targetDept.id', 'targetDept.name'
        ]);
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.where('(po.code LIKE :s OR bom.name LIKE :s)', { s });
        }
        if (query.status)
            qb.andWhere('po.status = :status', { status: query.status });
        const sortFieldMap = {
            'code': 'po.code',
            'status': 'po.status',
            'plannedQuantity': 'po.plannedQuantity',
            'createdAt': 'po.createdAt'
        };
        const sortCol = sortFieldMap[query.sortBy || ''] || 'po.createdAt';
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
    async findOneOrder(id) {
        const po = await this.transactionContext.manager.findOne(production_order_entity_1.ProductionOrder, {
            where: { id },
            relations: ['bom', 'bom.items', 'bom.items.item', 'sourceDepartment', 'targetDepartment'],
        });
        if (!po)
            throw new common_1.NotFoundException('Üretim emri bulunamadı');
        return po;
    }
    async createOrder(dto, userId) {
        const manager = this.transactionContext.manager;
        const bom = await this.findOneBom(dto.bomId);
        if (!bom.isActive)
            throw new common_1.BadRequestException('Sadece aktif reçeteler kullanılabilir.');
        const code = await this.sequenceGenerator.generateProductionCode(manager);
        const po = manager.create(production_order_entity_1.ProductionOrder, {
            code,
            bomId: dto.bomId,
            plannedQuantity: new decimal_js_1.Decimal(dto.plannedQuantity),
            producedQuantity: new decimal_js_1.Decimal(dto.producedQuantity || 0),
            wastageQuantity: new decimal_js_1.Decimal(dto.wastageQuantity || 0),
            sourceDepartmentId: dto.sourceDepartmentId ?? undefined,
            targetDepartmentId: dto.targetDepartmentId ?? undefined,
            startDate: dto.startDate ?? undefined,
            endDate: dto.endDate ?? undefined,
            notes: dto.notes ?? undefined,
            status: dto.status || 'draft',
            unitCost: new decimal_js_1.Decimal(0),
            totalCost: new decimal_js_1.Decimal(0),
            laborCost: new decimal_js_1.Decimal(dto.laborCost || 0),
            overheadCost: new decimal_js_1.Decimal(dto.overheadCost || 0),
            createdBy: userId,
        });
        const saved = await manager.save(po);
        return this.findOneOrder(saved.id);
    }
    async updateOrder(id, dto, userId) {
        const po = await this.findOneOrder(id);
        if (po.status === 'completed' || po.status === 'cancelled') {
            throw new common_1.BadRequestException('Tamamlanmış veya iptal edilmiş emirler değiştirilemez.');
        }
        if (dto.status === 'completed') {
            return this.completeOrder(id, dto, userId);
        }
        if (dto.bomId !== undefined)
            po.bomId = dto.bomId;
        if (dto.plannedQuantity !== undefined)
            po.plannedQuantity = new decimal_js_1.Decimal(dto.plannedQuantity);
        if (dto.producedQuantity !== undefined)
            po.producedQuantity = new decimal_js_1.Decimal(dto.producedQuantity);
        if (dto.wastageQuantity !== undefined)
            po.wastageQuantity = new decimal_js_1.Decimal(dto.wastageQuantity);
        if (dto.sourceDepartmentId !== undefined)
            po.sourceDepartmentId = dto.sourceDepartmentId;
        if (dto.targetDepartmentId !== undefined)
            po.targetDepartmentId = dto.targetDepartmentId;
        if (dto.startDate !== undefined)
            po.startDate = dto.startDate;
        if (dto.endDate !== undefined)
            po.endDate = dto.endDate;
        if (dto.status !== undefined)
            po.status = dto.status;
        if (dto.laborCost !== undefined)
            po.laborCost = new decimal_js_1.Decimal(dto.laborCost);
        if (dto.overheadCost !== undefined)
            po.overheadCost = new decimal_js_1.Decimal(dto.overheadCost);
        if (dto.notes !== undefined)
            po.notes = dto.notes;
        po.updatedBy = userId || null;
        return this.poRepo.save(po);
    }
    async completeOrder(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const po = await manager.findOne(production_order_entity_1.ProductionOrder, {
            where: { id },
            lock: { mode: 'pessimistic_write' },
            relations: ['bom', 'bom.items', 'bom.items.item', 'bom.targetItem']
        });
        if (!po || po.status === 'completed')
            throw new common_1.BadRequestException('İş emri bulunamadı veya zaten tamamlanmış.');
        if (!po.bom)
            throw new common_1.BadRequestException('İş emrine bağlı reçete bulunamadı. Silinmiş veya yetim kayıt olabilir.');
        const producedQty = new decimal_js_1.Decimal(dto.producedQuantity ?? po.producedQuantity);
        const sourceDeptId = dto.sourceDepartmentId ?? po.sourceDepartmentId;
        const targetDeptId = dto.targetDepartmentId ?? po.targetDepartmentId;
        if (producedQty.lte(0) || !sourceDeptId || !targetDeptId) {
            throw new common_1.BadRequestException('Miktar ve depo bilgileri eksik veya geçersiz.');
        }
        const targetItem = po.bom.targetItem;
        if (!targetItem)
            throw new common_1.BadRequestException('Hedef ürün bulunamadı.');
        const itemsToDecrease = [];
        let totalMaterialCost = new decimal_js_1.Decimal(0);
        const sortedItems = [...po.bom.items].sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)));
        for (const bomItem of sortedItems) {
            const requiredQty = finance_helper_1.FinanceHelper.mul(bomItem.quantity, producedQty);
            const cost = new decimal_js_1.Decimal(bomItem.item?.movingAverageCost || bomItem.item?.purchasePrice || 0);
            totalMaterialCost = finance_helper_1.FinanceHelper.add(totalMaterialCost, finance_helper_1.FinanceHelper.mul(requiredQty, cost));
            itemsToDecrease.push({ itemId: bomItem.itemId, quantity: requiredQty });
        }
        if (itemsToDecrease.length > 0) {
            await this.stocksService.decreaseStockBulk(itemsToDecrease, sourceDeptId, manager, { type: 'production', id: po.id, description: `Sarfiyat: ${po.code}` }, userId);
        }
        const labor = new decimal_js_1.Decimal(dto.laborCost ?? po.laborCost ?? 0);
        const overhead = new decimal_js_1.Decimal(dto.overheadCost ?? po.overheadCost ?? 0);
        const totalCost = finance_helper_1.FinanceHelper.add(finance_helper_1.FinanceHelper.add(totalMaterialCost, labor), overhead);
        const unitCost = finance_helper_1.FinanceHelper.div(totalCost, producedQty, 4);
        await this.stocksService.increaseStock(targetItem.id, targetDeptId, producedQty, unitCost, manager, { type: 'production', id: po.id, description: `Üretim: ${po.code}` }, userId);
        await manager.update(production_order_entity_1.ProductionOrder, po.id, {
            status: 'completed',
            producedQuantity: producedQty,
            sourceDepartmentId: sourceDeptId,
            targetDepartmentId: targetDeptId,
            unitCost,
            totalCost,
            laborCost: labor,
            overheadCost: overhead,
            endDate: dto.endDate ?? date_utils_1.DateUtils.getToday(),
            updatedBy: userId
        });
        return this.findOneOrder(po.id);
    }
    async deleteOrder(id) {
        const po = await this.findOneOrder(id);
        if (po.status === 'completed' || po.status === 'in_progress') {
            throw new common_1.BadRequestException('Bu aşamadaki emirler silinemez.');
        }
        await this.poRepo.softDelete(id);
    }
    async getStatus() {
        const statuses = ['draft', 'planned', 'in_progress', 'completed'];
        const counts = await Promise.all(statuses.map(s => this.poRepo.count({ where: { status: s } })));
        return {
            draft: counts[0], planned: counts[1], in_progress: counts[2], completed: counts[3],
            total: counts.reduce((a, b) => a + b, 0)
        };
    }
};
exports.ProductionService = ProductionService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.CreateBomDto, String]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "createBom", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, production_dto_1.UpdateBomDto, String]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "updateBom", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.CreateProductionOrderDto, String]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "createOrder", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, production_dto_1.UpdateProductionOrderDto, String]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "updateOrder", null);
exports.ProductionService = ProductionService = ProductionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bom_entity_1.Bom)),
    __param(1, (0, typeorm_1.InjectRepository)(bom_item_entity_1.BomItem)),
    __param(2, (0, typeorm_1.InjectRepository)(production_order_entity_1.ProductionOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        stocks_service_1.StocksService,
        items_service_1.ItemsService,
        logs_service_1.LogsService,
        transaction_context_service_1.TransactionContextService])
], ProductionService);
//# sourceMappingURL=production.service.js.map