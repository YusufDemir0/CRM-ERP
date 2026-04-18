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
const transactional_decorator_1 = require("../../common/decorators/transactional.decorator");
const transaction_context_service_1 = require("../../common/services/transaction-context.service");
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
            .leftJoinAndSelect('bom.items', 'items')
            .leftJoinAndSelect('items.item', 'item')
            .leftJoinAndSelect('bom.targetItem', 'targetItem');
        if (query.search) {
            qb.andWhere('(bom.name LIKE :s OR targetItem.name LIKE :s OR targetItem.code LIKE :s)', { s: `%${query.search}%` });
        }
        if (query.state !== undefined) {
            qb.andWhere('bom.state = :state', { state: query.state });
        }
        qb.orderBy('bom.createdAt', 'DESC').skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOneBom(id) {
        const bom = await this.bomRepo.findOne({
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
        const bom = manager.create(bom_entity_1.Bom, {
            name: dto.name,
            description: dto.description || null,
            targetItemId: dto.targetItemId || null,
            version: version,
            isActive: true,
            createdBy: userId,
        });
        const savedBom = await manager.save(bom);
        const groupedItems = dto.items.reduce((acc, current) => {
            const existing = acc.find(i => i.itemId === current.itemId);
            if (existing) {
                existing.quantity = finance_helper_1.FinanceHelper.add(existing.quantity, current.quantity);
            }
            else {
                acc.push({ itemId: current.itemId, quantity: new decimal_js_1.Decimal(current.quantity), description: current.description });
            }
            return acc;
        }, []);
        for (const itemDto of groupedItems) {
            const item = await manager.findOne(item_entity_1.Item, { where: { id: itemDto.itemId } });
            if (!item || item.state !== 1) {
                throw new common_1.BadRequestException(`Ürün bulunamadı veya pasif durumda (ID: ${itemDto.itemId}). Reçeteye eklenemez.`);
            }
            const bomItem = manager.create(bom_item_entity_1.BomItem, {
                bomId: savedBom.id,
                itemId: itemDto.itemId,
                quantity: itemDto.quantity,
                description: itemDto.description || '',
                createdBy: userId,
            });
            await manager.save(bomItem);
        }
        return this.findOneBom(savedBom.id);
    }
    async updateBom(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const bom = await manager.findOne(bom_entity_1.Bom, { where: { id } });
        if (!bom)
            throw new common_1.NotFoundException('Reçete (BOM) bulunamadı');
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
        if (dto.items && dto.items.length > 0) {
            await manager.update(bom_entity_1.Bom, id, { isActive: false, updatedBy: userId });
            const lastVersion = bom.version;
            const newBom = manager.create(bom_entity_1.Bom, {
                name: dto.name ?? bom.name,
                description: dto.description ?? bom.description,
                targetItemId: dto.targetItemId ?? bom.targetItemId,
                version: lastVersion + 1,
                isActive: true,
                createdBy: userId,
            });
            const savedNew = await manager.save(newBom);
            for (const itemDto of dto.items) {
                await manager.save(manager.create(bom_item_entity_1.BomItem, {
                    bomId: savedNew.id,
                    itemId: itemDto.itemId,
                    quantity: itemDto.quantity,
                    createdBy: userId
                }));
            }
            return this.findOneBom(savedNew.id);
        }
        const finalSaved = await manager.save(bom);
        return this.findOneBom(finalSaved.id);
    }
    async deleteBom(id) {
        const bom = await this.findOneBom(id);
        const usageCount = await this.poRepo.count({ where: { bomId: id } });
        if (usageCount > 0) {
            throw new common_1.BadRequestException(`Bu reçete ${usageCount} adet üretim emrinde kullanılmaktadır ve silinemez. Arşivlemeyi deneyin.`);
        }
        await this.bomRepo.softDelete(id);
    }
    async countItemUsageInBoms(itemId) {
        return this.bomItemRepo.count({ where: { itemId } });
    }
    async findAllOrders(query) {
        const qb = this.poRepo.createQueryBuilder('po')
            .leftJoinAndSelect('po.bom', 'bom')
            .leftJoinAndSelect('po.sourceDepartment', 'sourceDept')
            .leftJoinAndSelect('po.targetDepartment', 'targetDept');
        if (query.search)
            qb.where('(po.code LIKE :s OR bom.name LIKE :s)', { s: `%${query.search}%` });
        if (query.status)
            qb.andWhere('po.status = :status', { status: query.status });
        qb.orderBy('po.createdAt', 'DESC').skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOneOrder(id) {
        const po = await this.poRepo.findOne({
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
        if (!bom.isActive) {
            throw new common_1.BadRequestException('Sadece aktif (aktif versiyon) reçeteler ile üretim emri oluşturulabilir.');
        }
        const code = await this.sequenceGenerator.generateProductionCode(manager);
        const po = manager.create(production_order_entity_1.ProductionOrder, {
            code,
            bomId: dto.bomId,
            plannedQuantity: new decimal_js_1.Decimal(dto.plannedQuantity || 0),
            producedQuantity: new decimal_js_1.Decimal(0),
            wastageQuantity: new decimal_js_1.Decimal(0),
            sourceDepartmentId: dto.sourceDepartmentId || null,
            targetDepartmentId: dto.targetDepartmentId || null,
            startDate: dto.startDate,
            endDate: dto.endDate,
            notes: dto.notes,
            status: 'draft',
            createdBy: userId,
        });
        const saved = await manager.save(po);
        return this.findOneOrder(saved.id);
    }
    async updateOrder(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const po = await this.findOneOrder(id);
        if (po.status === 'completed' || po.status === 'cancelled') {
            throw new common_1.BadRequestException('Tamamlanmış veya iptal edilmiş üretim emirleri üzerinde değişiklik yapılamaz.');
        }
        if (dto.status === 'completed') {
            const producedQty = new decimal_js_1.Decimal(dto.producedQuantity ?? po.producedQuantity);
            const sourceDeptId = dto.sourceDepartmentId ?? po.sourceDepartmentId;
            const targetDeptId = dto.targetDepartmentId ?? po.targetDepartmentId;
            if (new decimal_js_1.Decimal(producedQty).lte(0))
                throw new common_1.BadRequestException('Üretilen miktar 0 (sıfır) olarak işlem tamamlanamaz.');
            if (!sourceDeptId)
                throw new common_1.BadRequestException('Hammadde stok düşümü (sarf) için kaynak depo seçimi zorunludur.');
            if (!targetDeptId)
                throw new common_1.BadRequestException('Üretilen ürünün stoğa girebilmesi için hedef depo seçimi zorunludur.');
            const lockedPo = await manager.findOne(production_order_entity_1.ProductionOrder, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
                relations: ['bom', 'bom.items', 'bom.items.item']
            });
            if (!lockedPo)
                throw new common_1.NotFoundException('İş emri kilitlenemedi veya bulunamadı.');
            if (lockedPo.status === 'completed')
                throw new common_1.BadRequestException('Bu iş emri bir başka işlem tarafından zaten tamamlanmış.');
            const targetItem = lockedPo.bom.targetItem;
            if (!targetItem)
                throw new common_1.BadRequestException('Bu reçetede (BOM) çıkacak ana ürün belirlenmediği için stoklara üretim girişi yapılamıyor!');
            let totalMaterialCost = new decimal_js_1.Decimal(0);
            const sortedBomItems = [...lockedPo.bom.items].sort((a, b) => a.itemId - b.itemId);
            for (const bomItem of sortedBomItems) {
                const requiredQty = finance_helper_1.FinanceHelper.mul(bomItem.quantity, producedQty);
                const currentComponentMAC = new decimal_js_1.Decimal(bomItem.item?.movingAverageCost || bomItem.item?.purchasePrice || 0);
                const itemTotalCost = finance_helper_1.FinanceHelper.mul(requiredQty, currentComponentMAC);
                totalMaterialCost = finance_helper_1.FinanceHelper.add(totalMaterialCost, itemTotalCost);
                await this.stocksService.decreaseStock(bomItem.itemId, sourceDeptId, requiredQty, manager, { type: 'production', id: lockedPo.id, description: `Üretim Sarfiyat Çıkışı: İş Emri ${lockedPo.code}` }, userId);
            }
            const laborCost = new decimal_js_1.Decimal(dto.laborCost ?? lockedPo.laborCost ?? 0);
            const overheadCost = new decimal_js_1.Decimal(dto.overheadCost ?? lockedPo.overheadCost ?? 0);
            const totalProductionCost = finance_helper_1.FinanceHelper.add(finance_helper_1.FinanceHelper.add(totalMaterialCost, laborCost), overheadCost);
            const unitCost = finance_helper_1.FinanceHelper.div(totalProductionCost, producedQty, 4);
            await this.stocksService.increaseStock(targetItem.id, targetDeptId, producedQty, unitCost, manager, { type: 'production', id: lockedPo.id, description: `Üretim Mamül Girişi: İş Emri ${lockedPo.code}` }, userId);
            await manager.update(production_order_entity_1.ProductionOrder, lockedPo.id, {
                status: 'completed',
                producedQuantity: producedQty,
                wastageQuantity: dto.wastageQuantity ?? lockedPo.wastageQuantity,
                sourceDepartmentId: sourceDeptId,
                targetDepartmentId: targetDeptId,
                unitCost,
                totalCost: totalProductionCost,
                laborCost,
                overheadCost,
                endDate: dto.endDate ?? date_utils_1.DateUtils.getToday(),
                notes: dto.notes ?? lockedPo.notes,
                updatedBy: userId
            });
            this.logsService.logActivity({
                userId,
                module: 'production',
                action: 'COMPLETE_PRODUCTION',
                tag: 'SUCCESS',
                details: `Üretim tamamlandı: ${lockedPo.code}, Ürün: ${targetItem.name}, Miktar: ${producedQty}`,
            });
            this.logger.log(`✅ İş Emri: ${lockedPo.code} başarıyla Tamamlandı.`);
            return this.findOneOrder(lockedPo.id);
        }
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
    async deleteOrder(id) {
        const po = await this.findOneOrder(id);
        if (po.status === 'completed' || po.status === 'in_progress') {
            throw new common_1.BadRequestException('Başlamış veya bitmiş üretim emirleri silinemez. İptal statüsünü deneyiniz.');
        }
        await this.poRepo.softDelete(id);
    }
    async getStatus() {
        const [draft, planned, inProgress, completed] = await Promise.all([
            this.poRepo.count({ where: { status: 'draft' } }),
            this.poRepo.count({ where: { status: 'planned' } }),
            this.poRepo.count({ where: { status: 'in_progress' } }),
            this.poRepo.count({ where: { status: 'completed' } }),
        ]);
        return { draft, planned, inProgress, completed, total: draft + planned + inProgress + completed };
    }
};
exports.ProductionService = ProductionService;
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.CreateBomDto, Number]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "createBom", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, production_dto_1.UpdateBomDto, Number]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "updateBom", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_dto_1.CreateProductionOrderDto, Number]),
    __metadata("design:returntype", Promise)
], ProductionService.prototype, "createOrder", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, production_dto_1.UpdateProductionOrderDto, Number]),
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