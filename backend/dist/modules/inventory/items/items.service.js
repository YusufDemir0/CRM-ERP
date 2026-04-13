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
const item_code_group_entity_1 = require("./entities/item-code-group.entity");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
let ItemsService = class ItemsService {
    constructor(itemRepo, itemTypeRepo, qtyTypeRepo, codeGroupRepo, dataSource, sequenceGenerator) {
        this.itemRepo = itemRepo;
        this.itemTypeRepo = itemTypeRepo;
        this.qtyTypeRepo = qtyTypeRepo;
        this.codeGroupRepo = codeGroupRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
    }
    async findAll(query) {
        const qb = this.itemRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.itemType', 'itemType')
            .leftJoinAndSelect('item.itemCodeGroup', 'itemCodeGroup')
            .leftJoinAndSelect('item.quantityType', 'quantityType')
            .leftJoinAndSelect('item.provider', 'provider')
            .leftJoinAndSelect('item.currency', 'currency');
        if (query.search) {
            qb.where('(item.name LIKE :s OR item.code LIKE :s OR item.description LIKE :s OR itemType.name LIKE :s OR provider.name LIKE :s)', { s: `%${query.search}%` });
        }
        if (query.itemTypeId) {
            qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
        }
        if (query.state !== undefined) {
            qb.andWhere('item.state = :state', { state: query.state });
        }
        const allowedSortCols = ['createdAt', 'name', 'code', 'purchasePrice', 'salePrice', 'criticalLimit'];
        const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
        qb.orderBy(`item.${sortCol}`, query.sortOrder || 'DESC');
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
            relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
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
            const code = await this.sequenceGenerator.generateItemCode(queryRunner, dto.itemCodeGroupId);
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
        if (dto.name !== undefined)
            item.name = dto.name;
        if (dto.itemTypeId !== undefined)
            item.itemTypeId = dto.itemTypeId;
        if (dto.itemCodeGroupId !== undefined)
            item.itemCodeGroupId = dto.itemCodeGroupId;
        if (dto.code !== undefined)
            item.code = dto.code;
        if (dto.code1 !== undefined)
            item.code1 = dto.code1;
        if (dto.code2 !== undefined)
            item.code2 = dto.code2;
        if (dto.criticalLimit !== undefined)
            item.criticalLimit = dto.criticalLimit;
        if (dto.image !== undefined)
            item.image = dto.image;
        if (dto.purchasePrice !== undefined)
            item.purchasePrice = dto.purchasePrice;
        if (dto.salePrice !== undefined)
            item.salePrice = dto.salePrice;
        if (dto.netPrice !== undefined)
            item.netPrice = dto.netPrice;
        if (dto.currencyId !== undefined)
            item.currencyId = dto.currencyId;
        if (dto.quantityTypeId !== undefined)
            item.quantityTypeId = dto.quantityTypeId;
        if (dto.kdv !== undefined)
            item.kdv = dto.kdv;
        if (dto.description !== undefined)
            item.description = dto.description;
        if (dto.notes !== undefined)
            item.notes = dto.notes;
        if (dto.providerId !== undefined)
            item.providerId = dto.providerId;
        if (dto.state !== undefined)
            item.state = dto.state;
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
    async updateItemType(id, dto, userId) {
        const type = await this.itemTypeRepo.findOne({ where: { id } });
        if (!type)
            throw new common_1.NotFoundException('Ürün tipi bulunamadı');
        if (dto.state === 0) {
            const activeItems = await this.itemRepo.count({ where: { itemTypeId: id, state: 1 } });
            if (activeItems > 0) {
                throw new common_1.BadRequestException(`Bu türde ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
            }
        }
        if (dto.name !== undefined)
            type.name = dto.name;
        if (dto.abbreviation !== undefined)
            type.abbreviation = dto.abbreviation;
        if (dto.state !== undefined)
            type.state = dto.state;
        type.updatedBy = userId || null;
        return this.itemTypeRepo.save(type);
    }
    async softDeleteItemType(id) {
        const activeItems = await this.itemRepo.count({ where: { itemTypeId: id, state: 1 } });
        if (activeItems > 0) {
            throw new common_1.BadRequestException('Bu türde aktif ürünler bulunduğu için silinemez.');
        }
        await this.itemTypeRepo.softDelete(id);
    }
    async findAllItemCodeGroups() {
        return this.codeGroupRepo.find();
    }
    async createItemCodeGroup(dto, userId) {
        const group = this.codeGroupRepo.create({ ...dto, createdBy: userId });
        return this.codeGroupRepo.save(group);
    }
    async updateItemCodeGroup(id, dto, userId) {
        const group = await this.codeGroupRepo.findOne({ where: { id } });
        if (!group)
            throw new common_1.NotFoundException('Ürün kod grubu bulunamadı');
        if (dto.name !== undefined)
            group.name = dto.name;
        if (dto.prefix !== undefined)
            group.prefix = dto.prefix;
        if (dto.state !== undefined)
            group.state = dto.state;
        group.updatedBy = userId || null;
        return this.codeGroupRepo.save(group);
    }
    async softDeleteItemCodeGroup(id) {
        const activeItems = await this.itemRepo.count({ where: { itemCodeGroupId: id, state: 1 } });
        if (activeItems > 0) {
            throw new common_1.BadRequestException('Bu grupta aktif ürünler bulunduğu için silinemez.');
        }
        await this.codeGroupRepo.softDelete(id);
    }
    async findAllQuantityTypes() {
        return this.qtyTypeRepo.find();
    }
    async createQuantityType(dto, userId) {
        const type = this.qtyTypeRepo.create({ ...dto, createdBy: userId });
        return this.qtyTypeRepo.save(type);
    }
    async updateQuantityType(id, dto, userId) {
        const type = await this.qtyTypeRepo.findOne({ where: { id } });
        if (!type)
            throw new common_1.NotFoundException('Birim bulunamadı');
        if (dto.name !== undefined)
            type.name = dto.name;
        if (dto.abbreviation !== undefined)
            type.abbreviation = dto.abbreviation;
        if (dto.state !== undefined)
            type.state = dto.state;
        type.updatedBy = userId || null;
        return this.qtyTypeRepo.save(type);
    }
    async softDeleteQuantityType(id) {
        const activeItems = await this.itemRepo.count({ where: { quantityTypeId: id, state: 1 } });
        if (activeItems > 0) {
            throw new common_1.BadRequestException('Bu birimi kullanan aktif ürünler bulunduğu için silinemez.');
        }
        await this.qtyTypeRepo.softDelete(id);
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
    __param(3, (0, typeorm_1.InjectRepository)(item_code_group_entity_1.ItemCodeGroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService])
], ItemsService);
//# sourceMappingURL=items.service.js.map