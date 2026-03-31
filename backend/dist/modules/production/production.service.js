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
exports.ProductionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bom_entity_1 = require("./entities/bom.entity");
const bom_item_entity_1 = require("./entities/bom-item.entity");
const production_order_entity_1 = require("./entities/production-order.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
let ProductionService = class ProductionService {
    constructor(bomRepo, bomItemRepo, poRepo, dataSource, sequenceGenerator) {
        this.bomRepo = bomRepo;
        this.bomItemRepo = bomItemRepo;
        this.poRepo = poRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
    }
    async findAllBoms(query) {
        const qb = this.bomRepo.createQueryBuilder('bom')
            .leftJoinAndSelect('bom.items', 'items')
            .leftJoinAndSelect('items.item', 'item');
        if (query.search)
            qb.where('bom.name LIKE :s', { s: `%${query.search}%` });
        qb.orderBy('bom.name', 'ASC').skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOneBom(id) {
        const bom = await this.bomRepo.findOne({
            where: { id },
            relations: ['items', 'items.item'],
        });
        if (!bom)
            throw new common_1.NotFoundException('BOM bulunamadı');
        return bom;
    }
    async createBom(dto, userId) {
        const bom = new bom_entity_1.Bom();
        bom.name = dto.name;
        bom.description = dto.description || null;
        bom.createdBy = userId ?? null;
        const savedBom = await this.bomRepo.save(bom);
        for (const itemDto of dto.items) {
            const bomItem = this.bomItemRepo.create({
                bomId: savedBom.id,
                itemId: itemDto.itemId,
                quantity: itemDto.quantity,
                description: itemDto.description,
                createdBy: userId,
            });
            await this.bomItemRepo.save(bomItem);
        }
        return this.findOneBom(savedBom.id);
    }
    async updateBom(id, dto, userId) {
        const bom = await this.findOneBom(id);
        Object.assign(bom, dto);
        bom.updatedBy = userId || null;
        return this.bomRepo.save(bom);
    }
    async deleteBom(id) {
        await this.findOneBom(id);
        await this.bomRepo.softDelete(id);
    }
    async findAllOrders(query) {
        const qb = this.poRepo.createQueryBuilder('po')
            .leftJoinAndSelect('po.bom', 'bom');
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
            relations: ['bom', 'bom.items', 'bom.items.item'],
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
        Object.assign(po, dto);
        po.updatedBy = userId || null;
        return this.poRepo.save(po);
    }
    async deleteOrder(id) {
        await this.findOneOrder(id);
        await this.poRepo.softDelete(id);
    }
};
exports.ProductionService = ProductionService;
exports.ProductionService = ProductionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bom_entity_1.Bom)),
    __param(1, (0, typeorm_1.InjectRepository)(bom_item_entity_1.BomItem)),
    __param(2, (0, typeorm_1.InjectRepository)(production_order_entity_1.ProductionOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService])
], ProductionService);
//# sourceMappingURL=production.service.js.map