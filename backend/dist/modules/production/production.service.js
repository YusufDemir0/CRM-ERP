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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bom_entity_1 = require("./entities/bom.entity");
const bom_item_entity_1 = require("./entities/bom-item.entity");
const production_order_entity_1 = require("./entities/production-order.entity");
const item_entity_1 = require("../inventory/items/entities/item.entity");
const stock_entity_1 = require("../inventory/stocks/entities/stock.entity");
const stock_movement_entity_1 = require("../inventory/stocks/entities/stock-movement.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
let ProductionService = ProductionService_1 = class ProductionService {
    constructor(bomRepo, bomItemRepo, poRepo, itemRepo, dataSource, sequenceGenerator) {
        this.bomRepo = bomRepo;
        this.bomItemRepo = bomItemRepo;
        this.poRepo = poRepo;
        this.itemRepo = itemRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.logger = new common_1.Logger(ProductionService_1.name);
    }
    async findAllBoms(query) {
        const qb = this.bomRepo.createQueryBuilder('bom')
            .leftJoinAndSelect('bom.items', 'items')
            .leftJoinAndSelect('items.item', 'item')
            .leftJoinAndSelect('bom.targetItem', 'targetItem');
        if (query.search)
            qb.where('bom.name LIKE :s', { s: `%${query.search}%` });
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
        const bom = this.bomRepo.create({
            name: dto.name,
            description: dto.description || null,
            targetItemId: dto.targetItemId || null,
            createdBy: userId,
        });
        const savedBom = await this.bomRepo.save(bom);
        const groupedItems = dto.items.reduce((acc, current) => {
            const existing = acc.find(i => i.itemId === current.itemId);
            if (existing) {
                existing.quantity = Number(existing.quantity) + Number(current.quantity);
            }
            else {
                acc.push({ ...current });
            }
            return acc;
        }, []);
        for (const itemDto of groupedItems) {
            const item = await this.itemRepo.findOne({ where: { id: itemDto.itemId } });
            if (!item || item.state !== 1) {
                throw new common_1.BadRequestException(`Ürün bulunamadı veya pasif durumda (ID: ${itemDto.itemId}). Reçeteye eklenemez.`);
            }
            const bomItem = this.bomItemRepo.create({
                bomId: savedBom.id,
                itemId: itemDto.itemId,
                quantity: itemDto.quantity,
                description: itemDto.description || '',
                createdBy: userId,
            });
            await this.bomItemRepo.save(bomItem);
        }
        return this.findOneBom(savedBom.id);
    }
    async updateBom(id, dto, userId) {
        const bom = await this.findOneBom(id);
        if (dto.name !== undefined)
            bom.name = dto.name;
        if (dto.description !== undefined)
            bom.description = dto.description;
        if (dto.targetItemId !== undefined)
            bom.targetItemId = dto.targetItemId;
        if (dto.state !== undefined)
            bom.state = dto.state;
        bom.updatedBy = userId || null;
        return this.bomRepo.save(bom);
    }
    async deleteBom(id) {
        await this.findOneBom(id);
        await this.bomRepo.softDelete(id);
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
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const code = await this.sequenceGenerator.generateProductionCode(queryRunner);
            const po = queryRunner.manager.create(production_order_entity_1.ProductionOrder, {
                code,
                bomId: dto.bomId,
                plannedQuantity: dto.plannedQuantity,
                sourceDepartmentId: dto.sourceDepartmentId || null,
                targetDepartmentId: dto.targetDepartmentId || null,
                startDate: dto.startDate,
                endDate: dto.endDate,
                notes: dto.notes,
                status: 'draft',
                createdBy: userId,
            });
            const saved = await queryRunner.manager.save(po);
            await queryRunner.commitTransaction();
            return this.findOneOrder(saved.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateOrder(id, dto, userId) {
        const po = await this.findOneOrder(id);
        if (po.status === 'completed' || po.status === 'cancelled') {
            throw new common_1.BadRequestException('Tamamlanmış veya iptal edilmiş üretim emirleri üzerinde değişiklik yapılamaz.');
        }
        if (dto.status === 'completed') {
            const producedQty = dto.producedQuantity ?? po.producedQuantity;
            const sourceDeptId = dto.sourceDepartmentId ?? po.sourceDepartmentId;
            const targetDeptId = dto.targetDepartmentId ?? po.targetDepartmentId;
            if (producedQty <= 0)
                throw new common_1.BadRequestException('Üretilen miktar 0 (sıfır) olarak işlem tamamlanamaz.');
            if (!sourceDeptId)
                throw new common_1.BadRequestException('Hammadde stok düşümü (sarf) için kaynak depo seçimi zorunludur.');
            if (!targetDeptId)
                throw new common_1.BadRequestException('Üretilen ürünün stoğa girebilmesi için hedef depo seçimi zorunludur.');
            const targetItem = po.bom.targetItem;
            if (!targetItem)
                throw new common_1.BadRequestException('Bu reçetede (BOM) çıkacak ana ürün belirlenmediği için stoklara üretim girişi yapılamıyor!');
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                for (const bomItem of po.bom.items) {
                    const requiredQty = Number(bomItem.quantity) * Number(producedQty);
                    let sourceStock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                        where: { itemId: bomItem.itemId, departmentId: sourceDeptId }
                    });
                    if (!sourceStock || Number(sourceStock.quantity) < requiredQty) {
                        throw new common_1.BadRequestException(`Depoda (ID: ${sourceDeptId}) YETERSİZ STOK: '${bomItem.item?.name}' maddesinden ${requiredQty} miktar sarf gerekiyor ancak ` +
                            `${sourceStock ? sourceStock.quantity : 0} miktar bulundu. Üretim tamamlanamaz.`);
                    }
                    const quantityBeforeOut = Number(sourceStock.quantity);
                    const quantityAfterOut = quantityBeforeOut - requiredQty;
                    await queryRunner.manager.update(stock_entity_1.Stock, sourceStock.id, {
                        quantity: quantityAfterOut,
                        updatedBy: userId
                    });
                    const movementOut = queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                        stockId: sourceStock.id,
                        quantity: requiredQty,
                        quantityBefore: quantityBeforeOut,
                        quantityAfter: quantityAfterOut,
                        type: 'out',
                        referenceType: 'production',
                        referenceId: po.id,
                        description: `Üretim Sarfiyat Çıkışı: İş Emri ${po.code}`,
                        createdBy: userId
                    });
                    await queryRunner.manager.save(movementOut);
                }
                let targetStock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                    where: { itemId: targetItem.id, departmentId: targetDeptId }
                });
                if (!targetStock) {
                    targetStock = queryRunner.manager.create(stock_entity_1.Stock, {
                        itemId: targetItem.id,
                        departmentId: targetDeptId,
                        quantity: 0,
                        createdBy: userId
                    });
                    targetStock = await queryRunner.manager.save(targetStock);
                }
                const quantityBeforeIn = Number(targetStock.quantity);
                const quantityAfterIn = quantityBeforeIn + Number(producedQty);
                await queryRunner.manager.update(stock_entity_1.Stock, targetStock.id, {
                    quantity: quantityAfterIn,
                    updatedBy: userId
                });
                const movementIn = queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                    stockId: targetStock.id,
                    quantity: producedQty,
                    quantityBefore: quantityBeforeIn,
                    quantityAfter: quantityAfterIn,
                    type: 'in',
                    referenceType: 'production',
                    referenceId: po.id,
                    description: `Üretim Mamül Girişi: İş Emri ${po.code}`,
                    createdBy: userId
                });
                await queryRunner.manager.save(movementIn);
                await queryRunner.manager.update(production_order_entity_1.ProductionOrder, po.id, {
                    status: 'completed',
                    producedQuantity: producedQty,
                    wastageQuantity: dto.wastageQuantity ?? po.wastageQuantity,
                    sourceDepartmentId: sourceDeptId,
                    targetDepartmentId: targetDeptId,
                    endDate: dto.endDate ?? po.endDate ?? new Date().toISOString().split('T')[0],
                    notes: dto.notes ?? po.notes,
                    updatedBy: userId
                });
                await queryRunner.commitTransaction();
                this.logger.log(`✅ İş Emri: ${po.code} başarıyla Tamamlandı ve depo giriş/çıkışları yansıdı.`);
                return this.findOneOrder(po.id);
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                this.logger.error(`❌ Üretim kapatılırken hata oluştu: ${error.message}`);
                throw error;
            }
            finally {
                await queryRunner.release();
            }
        }
        Object.assign(po, dto);
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
        sequence_generator_service_1.SequenceGeneratorService])
], ProductionService);
//# sourceMappingURL=production.service.js.map