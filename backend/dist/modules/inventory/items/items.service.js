"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const stock_entity_1 = require("../stocks/entities/stock.entity");
const inventory_dto_1 = require("../dto/inventory.dto");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const currencies_service_1 = require("../../finance/currencies/currencies.service");
const decimal_js_1 = require("decimal.js");
const transactional_decorator_1 = require("../../../common/decorators/transactional.decorator");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const sql_helper_1 = require("../../../common/utils/sql.helper");
let ItemsService = class ItemsService {
    constructor(itemRepo, itemTypeRepo, qtyTypeRepo, codeGroupRepo, stockRepo, dataSource, sequenceGenerator, currenciesService, transactionContext) {
        this.itemRepo = itemRepo;
        this.itemTypeRepo = itemTypeRepo;
        this.qtyTypeRepo = qtyTypeRepo;
        this.codeGroupRepo = codeGroupRepo;
        this.stockRepo = stockRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.currenciesService = currenciesService;
        this.transactionContext = transactionContext;
    }
    async findAll(query) {
        const qb = this.itemRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.itemType', 'itemType')
            .leftJoinAndSelect('item.itemCodeGroup', 'itemCodeGroup')
            .leftJoinAndSelect('item.quantityType', 'quantityType')
            .leftJoinAndSelect('item.provider', 'provider')
            .leftJoinAndSelect('item.currency', 'currency');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.andWhere('(item.name LIKE :s OR item.code LIKE :s OR item.code1 LIKE :s OR item.code2 LIKE :s OR item.description LIKE :s OR item.notes LIKE :s OR itemType.name LIKE :s OR provider.name LIKE :s)', { s });
        }
        if (query.itemTypeId)
            qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
        if (query.providerId)
            qb.andWhere('item.providerId = :providerId', { providerId: query.providerId });
        if (query.currencyId)
            qb.andWhere('item.currencyId = :currencyId', { currencyId: query.currencyId });
        if (query.state !== undefined)
            qb.andWhere('item.state = :state', { state: query.state });
        if (query.critical === 'true') {
            qb.andWhere('(SELECT COALESCE(SUM(quantity), 0) FROM stocks WHERE item_id = item.id) < item.criticalLimit');
            qb.andWhere('item.criticalLimit > 0');
        }
        const itemFilterMap = {
            name: 'item.name',
            code: 'item.code',
            code1: 'item.code1',
            code2: 'item.code2',
            description: 'item.description',
            notes: 'item.notes',
            barcode: 'item.barcode',
            taxRate: 'item.taxRate',
        };
        Object.keys(query).forEach(key => {
            const dbCol = itemFilterMap[key];
            const val = query[key];
            if (dbCol && val !== undefined) {
                const s = (0, sql_helper_1.getSafeSearchPattern)(val.toString());
                qb.andWhere(`${dbCol} LIKE :${key}`, { [key]: s });
            }
        });
        const sortFieldMap = {
            'name': 'item.name',
            'code': 'item.code',
            'purchasePrice': 'item.purchasePrice',
            'salePrice': 'item.salePrice',
            'criticalLimit': 'item.criticalLimit',
            'createdAt': 'item.createdAt',
            'itemType.name': 'itemType.name',
            'provider.name': 'provider.name',
            'state': 'item.state',
            'totalStock': '(SELECT COALESCE(SUM(quantity), 0) FROM stocks WHERE item_id = item.id)'
        };
        const sortCol = sortFieldMap[query.sortBy || ''] || 'item.createdAt';
        qb.orderBy(sortCol, query.sortOrder || 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const item = await this.transactionContext.manager.findOne(item_entity_1.Item, {
            where: { id },
            relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
        });
        if (!item)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        return item;
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        if (!dto.currencyId) {
            try {
                const defaultCurrency = await this.currenciesService.getDefault();
                dto.currencyId = Number(defaultCurrency.id);
            }
            catch (error) {
                console.warn('Default currency not found in ItemsService, setting to null');
            }
        }
        const code = await this.sequenceGenerator.generateItemCode(manager, dto.itemCodeGroupId);
        const existing = await manager.findOne(item_entity_1.Item, { where: { code } });
        if (existing) {
            throw new common_1.BadRequestException(`'${code}' kodlu bir ürün zaten mevcut.`);
        }
        const item = manager.create(item_entity_1.Item, {
            ...dto,
            code,
            movingAverageCost: new decimal_js_1.Decimal(0),
            createdBy: userId,
        });
        const savedItem = await manager.save(item);
        const { Department } = await Promise.resolve().then(() => __importStar(require('../../departments/entities/department.entity')));
        const departments = await manager.find(Department, { where: { state: 1 } });
        for (const dept of departments) {
            await manager.save(manager.create(stock_entity_1.Stock, {
                itemId: savedItem.id,
                departmentId: dept.id,
                quantity: new decimal_js_1.Decimal(0),
                reservedQuantity: new decimal_js_1.Decimal(0),
                createdBy: userId
            }));
        }
        return savedItem;
    }
    async update(id, dto, userId) {
        const item = await this.findOne(id);
        if (dto.code && dto.code !== item.code) {
            const existing = await this.itemRepo.findOne({ where: { code: dto.code } });
            if (existing && existing.id !== id) {
                throw new common_1.BadRequestException(`'${dto.code}' kodlu bir ürün zaten mevcut.`);
            }
        }
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
        if (dto.image !== undefined)
            item.image = dto.image;
        if (dto.currencyId !== undefined)
            item.currencyId = dto.currencyId;
        if (dto.quantityTypeId !== undefined)
            item.quantityTypeId = dto.quantityTypeId;
        if (dto.description !== undefined)
            item.description = dto.description;
        if (dto.notes !== undefined)
            item.notes = dto.notes;
        if (dto.providerId !== undefined)
            item.providerId = dto.providerId;
        if (dto.state !== undefined) {
            item.state = dto.state;
        }
        if (dto.criticalLimit !== undefined)
            item.criticalLimit = dto.criticalLimit;
        if (dto.purchasePrice !== undefined)
            item.purchasePrice = dto.purchasePrice;
        if (dto.salePrice !== undefined)
            item.salePrice = dto.salePrice;
        if (dto.netPrice !== undefined)
            item.netPrice = dto.netPrice;
        if (dto.kdv !== undefined)
            item.kdv = dto.kdv;
        item.updatedBy = userId || null;
        return this.itemRepo.save(item);
    }
    async softDelete(id, currentUserId) {
        const item = await this.findOne(id);
        const totalQtyResult = await this.stockRepo.createQueryBuilder('stock')
            .where('stock.itemId = :id', { id })
            .select('SUM(stock.quantity)', 'total')
            .getRawOne();
        const totalQty = new decimal_js_1.Decimal(totalQtyResult?.total || 0);
        if (!totalQty.isZero()) {
            throw new common_1.BadRequestException(`Stokta ${totalQty.toString()} adet ürün bulunduğu için silinemez. Lütfen önce stokları sıfırlayınız.`);
        }
        const { BomItem } = await Promise.resolve().then(() => __importStar(require('../../production/entities/bom-item.entity')));
        const bomUsage = await this.dataSource.getRepository(BomItem).count({ where: { itemId: id } });
        if (bomUsage > 0) {
            throw new common_1.BadRequestException(`Bu ürün ${bomUsage} adet üretim reçetesinde (BOM) kullanılmaktadır ve silinemez.`);
        }
        await this.itemRepo.update(id, {
            state: 0,
            updatedBy: currentUserId || null,
        });
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
        if (dto.state === 0) {
            const activeItems = await this.itemRepo.count({ where: { itemCodeGroupId: id, state: 1 } });
            if (activeItems > 0) {
                throw new common_1.BadRequestException(`Bu grupta ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
            }
        }
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
        if (dto.state === 0) {
            const activeItems = await this.itemRepo.count({ where: { quantityTypeId: id, state: 1 } });
            if (activeItems > 0) {
                throw new common_1.BadRequestException(`Bu birimi kullanan ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
            }
        }
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
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateItemDto, Number]),
    __metadata("design:returntype", Promise)
], ItemsService.prototype, "create", null);
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(1, (0, typeorm_1.InjectRepository)(item_type_entity_1.ItemType)),
    __param(2, (0, typeorm_1.InjectRepository)(quantity_type_entity_1.QuantityType)),
    __param(3, (0, typeorm_1.InjectRepository)(item_code_group_entity_1.ItemCodeGroup)),
    __param(4, (0, typeorm_1.InjectRepository)(stock_entity_1.Stock)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        currencies_service_1.CurrenciesService,
        transaction_context_service_1.TransactionContextService])
], ItemsService);
//# sourceMappingURL=items.service.js.map