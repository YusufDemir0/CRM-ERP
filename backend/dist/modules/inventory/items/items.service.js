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
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const item_entity_1 = require("./entities/item.entity");
const item_type_entity_1 = require("./entities/item-type.entity");
const quantity_type_entity_1 = require("./entities/quantity-type.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
let ItemsService = class ItemsService {
    constructor(itemRepo, itemTypeRepo, qtyTypeRepo, dataSource, sequenceGenerator) {
        this.itemRepo = itemRepo;
        this.itemTypeRepo = itemTypeRepo;
        this.qtyTypeRepo = qtyTypeRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
    }
    async findAll(query) {
        const qb = this.itemRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.itemType', 'itemType')
            .leftJoinAndSelect('item.quantityType', 'quantityType')
            .leftJoinAndSelect('item.provider', 'provider')
            .leftJoinAndSelect('item.currency', 'currency');
        if (query.search) {
            qb.where('(item.name LIKE :s OR item.code LIKE :s OR item.description LIKE :s OR item.brand LIKE :s OR item.model LIKE :s OR itemType.name LIKE :s OR provider.name LIKE :s)', { s: `%${query.search}%` });
        }
        if (query.itemTypeId) {
            qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
        }
        qb.orderBy(`item.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const item = await this.itemRepo.findOne({
            where: { id },
            relations: ['itemType', 'quantityType', 'provider', 'currency'],
        });
        if (!item)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        return item;
    }
    async create(dto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const code = await this.sequenceGenerator.generateItemCode(queryRunner, dto.itemTypeId);
            const item = queryRunner.manager.create(item_entity_1.Item, {
                ...dto,
                code,
                createdBy: userId,
            });
            const savedItem = await queryRunner.manager.save(item);
            await queryRunner.commitTransaction();
            return savedItem;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async update(id, dto, userId) {
        const item = await this.findOne(id);
        Object.assign(item, dto);
        item.updatedBy = userId || null;
        return this.itemRepo.save(item);
    }
    async softDelete(id) {
        await this.findOne(id);
        await this.itemRepo.softDelete(id);
    }
    async findAllItemTypes() {
        return this.itemTypeRepo.find();
    }
    async createItemType(dto, userId) {
        const type = this.itemTypeRepo.create({ ...dto, createdBy: userId });
        return this.itemTypeRepo.save(type);
    }
    async findAllQuantityTypes() {
        return this.qtyTypeRepo.find();
    }
    async createQuantityType(dto, userId) {
        const type = this.qtyTypeRepo.create({ ...dto, createdBy: userId });
        return this.qtyTypeRepo.save(type);
    }
    async getStatus() {
        const [active, passive, lowStock] = await Promise.all([
            this.itemRepo.count({ where: { state: 1 } }),
            this.itemRepo.count({ where: { state: 0 } }),
            this.itemRepo.count({ where: { state: 1, criticalLimit: (0, typeorm_2.MoreThan)(0) } }),
        ]);
        return { active, passive, total: active + passive, lowStock };
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(1, (0, typeorm_1.InjectRepository)(item_type_entity_1.ItemType)),
    __param(2, (0, typeorm_1.InjectRepository)(quantity_type_entity_1.QuantityType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService])
], ItemsService);
//# sourceMappingURL=items.service.js.map