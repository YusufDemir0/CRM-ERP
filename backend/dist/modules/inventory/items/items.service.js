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
const ExcelJS = __importStar(require("exceljs"));
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
const transactional_1 = require("@nestjs-cls/transactional");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const department_entity_1 = require("../../departments/entities/department.entity");
const bom_item_entity_1 = require("../../production/entities/bom-item.entity");
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
            .leftJoin('item.itemType', 'itemType')
            .leftJoin('item.quantityType', 'quantityType')
            .leftJoin('item.provider', 'provider')
            .leftJoin('item.currency', 'currency')
            .select([
            'item.id', 'item.name', 'item.code', 'item.code1', 'item.code2',
            'item.purchasePrice', 'item.salePrice', 'item.totalStock',
            'item.criticalLimit', 'item.state', 'item.createdAt',
            'itemType.id', 'itemType.name',
            'quantityType.id', 'quantityType.abbreviation',
            'provider.id', 'provider.name',
            'currency.id', 'currency.symbol'
        ]);
        if (query.search) {
            const searchPattern = query.search.replace(/[+><()~*\"@\-]/g, ' ').trim();
            if (searchPattern) {
                qb.andWhere('MATCH(item.name, item.code, item.code1, item.code2, item.description, item.notes) AGAINST(:s IN BOOLEAN MODE)', { s: `*${searchPattern}*` });
            }
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
            qb.andWhere('item.totalStock < item.criticalLimit AND item.criticalLimit > 0');
        }
        const sortFieldMap = {
            'name': 'item.name',
            'code': 'item.code',
            'purchasePrice': 'item.purchasePrice',
            'totalStock': 'item.totalStock',
            'createdAt': 'item.createdAt'
        };
        const sortCol = sortFieldMap[query.sortBy || ''] || 'item.createdAt';
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
    async findOne(id) {
        const item = await this.transactionContext.manager.findOne(item_entity_1.Item, {
            where: { id: String(id) },
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
                dto.currencyId = String(defaultCurrency.id);
            }
            catch (error) {
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
        const departments = await manager.find(department_entity_1.Department, { where: { state: 1 } });
        const initialStocks = departments.map(dept => manager.create(stock_entity_1.Stock, {
            itemId: String(savedItem.id),
            departmentId: String(dept.id),
            quantity: new decimal_js_1.Decimal(0),
            reservedQuantity: new decimal_js_1.Decimal(0),
            createdBy: userId
        }));
        if (initialStocks.length > 0) {
            await manager.save(stock_entity_1.Stock, initialStocks);
        }
        return savedItem;
    }
    async update(id, dto, userId) {
        const item = await this.findOne(id);
        const updateData = {
            updatedBy: userId || null
        };
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.itemTypeId !== undefined)
            updateData.itemTypeId = dto.itemTypeId;
        if (dto.itemCodeGroupId !== undefined)
            updateData.itemCodeGroupId = dto.itemCodeGroupId;
        if (dto.code !== undefined)
            updateData.code = dto.code;
        if (dto.code1 !== undefined)
            updateData.code1 = dto.code1;
        if (dto.code2 !== undefined)
            updateData.code2 = dto.code2;
        if (dto.image !== undefined)
            updateData.image = dto.image;
        if (dto.currencyId !== undefined)
            updateData.currencyId = dto.currencyId;
        if (dto.quantityTypeId !== undefined)
            updateData.quantityTypeId = dto.quantityTypeId;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        if (dto.providerId !== undefined)
            updateData.providerId = dto.providerId;
        if (dto.state === 0 && item.state !== 0) {
            await this.validateUsage(id);
        }
        if (dto.state !== undefined)
            updateData.state = dto.state;
        if (dto.criticalLimit !== undefined)
            updateData.criticalLimit = dto.criticalLimit;
        if (dto.purchasePrice !== undefined)
            updateData.purchasePrice = dto.purchasePrice;
        if (dto.salePrice !== undefined)
            updateData.salePrice = dto.salePrice;
        if (dto.netPrice !== undefined)
            updateData.netPrice = dto.netPrice;
        if (dto.kdv !== undefined)
            updateData.kdv = dto.kdv;
        await this.itemRepo.update(id, updateData);
        return this.findOne(id);
    }
    async importItems(items, userId) {
        const manager = this.transactionContext.manager;
        let updatedCount = 0;
        let insertedCount = 0;
        const errors = [];
        const itemCodes = items.map(i => i.code?.trim()).filter(Boolean);
        if (itemCodes.length === 0) {
            throw new common_1.BadRequestException('Aktarılacak geçerli ürün kodu bulunamadı.');
        }
        const [existingItems, itemTypes, qtyTypes, departments, defaultCurrency] = await Promise.all([
            manager.find(item_entity_1.Item, { where: { code: (0, typeorm_2.In)(itemCodes) } }),
            manager.find(item_type_entity_1.ItemType, { where: { state: 1 } }),
            manager.find(quantity_type_entity_1.QuantityType, { where: { state: 1 } }),
            manager.find(department_entity_1.Department, { where: { state: 1 } }),
            this.currenciesService.getDefault()
        ]);
        const defaultCurrencyId = defaultCurrency ? String(defaultCurrency.id) : null;
        if (itemTypes.length === 0 || qtyTypes.length === 0) {
            throw new common_1.BadRequestException('Sistemde tanımlı Ürün Tipi veya Birim bulunamadı. İçe aktarım yapılamaz.');
        }
        const existingMap = new Map(existingItems.map(i => [i.code, i]));
        const typeMap = new Map(itemTypes.map(t => [t.name.trim().toLocaleLowerCase('tr-TR'), String(t.id)]));
        const qtyMap = new Map(qtyTypes.map(q => [q.name.trim().toLocaleLowerCase('tr-TR'), String(q.id)]));
        const defaultTypeId = String(itemTypes[0]?.id);
        const defaultQtyId = String(qtyTypes[0]?.id);
        const newItemsToSave = [];
        const itemsToUpdate = [];
        for (const [index, row] of items.entries()) {
            if (!row.code || !row.name) {
                errors.push(`Satır ${index + 1}: Kod ve İsim zorunludur.`);
                continue;
            }
            const typeId = row.typeName ? typeMap.get(row.typeName.trim().toLocaleLowerCase('tr-TR')) || defaultTypeId : defaultTypeId;
            const qtyId = row.unitName ? qtyMap.get(row.unitName.trim().toLocaleLowerCase('tr-TR')) || defaultQtyId : defaultQtyId;
            const existing = existingMap.get(row.code.trim());
            if (existing) {
                existing.name = row.name.toLocaleUpperCase('tr-TR');
                existing.itemTypeId = typeId;
                existing.quantityTypeId = qtyId;
                if (row.purchasePrice !== undefined)
                    existing.purchasePrice = new decimal_js_1.Decimal(row.purchasePrice);
                if (row.salePrice !== undefined)
                    existing.salePrice = new decimal_js_1.Decimal(row.salePrice);
                if (row.kdv !== undefined)
                    existing.kdv = new decimal_js_1.Decimal(row.kdv);
                if (row.criticalLimit !== undefined)
                    existing.criticalLimit = new decimal_js_1.Decimal(row.criticalLimit);
                existing.updatedBy = userId;
                itemsToUpdate.push(existing);
                updatedCount++;
            }
            else {
                const newItem = manager.create(item_entity_1.Item, {
                    code: row.code.trim(),
                    name: row.name.trim().toLocaleUpperCase('tr-TR'),
                    itemTypeId: typeId,
                    quantityTypeId: qtyId,
                    currencyId: defaultCurrencyId,
                    purchasePrice: new decimal_js_1.Decimal(row.purchasePrice || 0),
                    salePrice: new decimal_js_1.Decimal(row.salePrice || 0),
                    kdv: new decimal_js_1.Decimal(row.kdv ?? 20),
                    criticalLimit: new decimal_js_1.Decimal(row.criticalLimit || 0),
                    movingAverageCost: new decimal_js_1.Decimal(0),
                    createdBy: userId,
                });
                newItemsToSave.push(newItem);
                insertedCount++;
            }
        }
        if (itemsToUpdate.length > 0) {
            await manager.save(item_entity_1.Item, itemsToUpdate);
        }
        if (newItemsToSave.length > 0) {
            const savedNewItems = await manager.save(item_entity_1.Item, newItemsToSave);
            const initialStocks = [];
            for (const item of savedNewItems) {
                for (const dept of departments) {
                    initialStocks.push(manager.create(stock_entity_1.Stock, {
                        itemId: String(item.id),
                        departmentId: String(dept.id),
                        quantity: new decimal_js_1.Decimal(0),
                        reservedQuantity: new decimal_js_1.Decimal(0),
                        createdBy: userId
                    }));
                }
            }
            if (initialStocks.length > 0) {
                await manager.save(stock_entity_1.Stock, initialStocks, { chunk: 100 });
            }
        }
        return { updatedCount, insertedCount, errors };
    }
    async exportToExcel(query) {
        query.limit = 10000;
        const { data: items } = await this.findAll(query);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ürün Listesi');
        worksheet.columns = [
            { header: 'KOD', key: 'code', width: 20 },
            { header: 'ÜRÜN ADI', key: 'name', width: 40 },
            { header: 'TÜR', key: 'itemType', width: 20 },
            { header: 'BİRİM', key: 'quantityType', width: 15 },
            { header: 'STOK', key: 'totalStock', width: 15 },
            { header: 'ALIŞ FİYATI', key: 'purchasePrice', width: 15 },
            { header: 'SATIŞ FİYATI', key: 'salePrice', width: 15 },
            { header: 'KDV', key: 'kdv', width: 10 },
            { header: 'KRİTİK LİMİT', key: 'criticalLimit', width: 15 },
        ];
        items.forEach(item => {
            worksheet.addRow({
                code: item.code,
                name: item.name,
                itemType: item.itemType?.name || '',
                quantityType: item.quantityType?.abbreviation || '',
                totalStock: Number(item.totalStock || 0),
                purchasePrice: Number(item.purchasePrice || 0),
                salePrice: Number(item.salePrice || 0),
                kdv: Number(item.kdv || 0),
                criticalLimit: Number(item.criticalLimit || 0),
            });
        });
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        const buffer = await workbook.xlsx.writeBuffer();
        return new common_1.StreamableFile(Buffer.from(buffer));
    }
    async softDelete(id, currentUserId) {
        await this.findOne(id);
        await this.validateUsage(id);
        await this.itemRepo.update(id, {
            state: 0,
            updatedBy: currentUserId || null,
        });
        await this.itemRepo.softDelete(id);
    }
    async validateUsage(id) {
        const manager = this.transactionContext.manager;
        const totalQtyResult = await manager.createQueryBuilder(stock_entity_1.Stock, 'stock')
            .where('stock.itemId = :id', { id })
            .select('SUM(stock.quantity)', 'total')
            .getRawOne();
        const totalQty = new decimal_js_1.Decimal(totalQtyResult?.total || 0);
        if (!totalQty.isZero()) {
            throw new common_1.BadRequestException(`Stokta ${totalQty.toString()} adet ürün bulunduğu için işlem yapılamaz.`);
        }
        const bomUsage = await manager.count(bom_item_entity_1.BomItem, { where: { itemId: id } });
        if (bomUsage > 0) {
            throw new common_1.BadRequestException(`Bu ürün ${bomUsage} adet üretim reçetesinde (BOM) kullanılmaktadır.`);
        }
    }
    async findAllItemTypes() {
        return this.itemTypeRepo.find();
    }
    async createItemType(dto, userId) {
        const type = this.itemTypeRepo.create({ ...dto, createdBy: userId });
        return this.itemTypeRepo.save(type);
    }
    async updateItemType(id, dto, userId) {
        const type = await this.itemTypeRepo.findOne({ where: { id: String(id) } });
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
        if (dto.isExcludedFromBom !== undefined)
            type.isExcludedFromBom = dto.isExcludedFromBom;
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
        const group = await this.codeGroupRepo.findOne({ where: { id: String(id) } });
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
        const type = await this.qtyTypeRepo.findOne({ where: { id: String(id) } });
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
            this.itemRepo.createQueryBuilder('item').where('item.state = 1 AND item.criticalLimit > 0').getCount(),
        ]);
        return { active, passive, total: active + passive, lowStock };
    }
};
exports.ItemsService = ItemsService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateItemDto, String]),
    __metadata("design:returntype", Promise)
], ItemsService.prototype, "create", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateItemDto, String]),
    __metadata("design:returntype", Promise)
], ItemsService.prototype, "update", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], ItemsService.prototype, "importItems", null);
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