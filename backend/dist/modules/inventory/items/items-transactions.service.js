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
exports.ItemsTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const transactional_1 = require("@nestjs-cls/transactional");
const ExcelJS = __importStar(require("exceljs"));
const item_entity_1 = require("./entities/item.entity");
const item_type_entity_1 = require("./entities/item-type.entity");
const quantity_type_entity_1 = require("./entities/quantity-type.entity");
const item_code_group_entity_1 = require("./entities/item-code-group.entity");
const stock_entity_1 = require("../stocks/entities/stock.entity");
const department_entity_1 = require("../../departments/entities/department.entity");
const bom_item_entity_1 = require("../../production/entities/bom-item.entity");
const currency_entity_1 = require("../../finance/currencies/entities/currency.entity");
const inventory_dto_1 = require("../dto/inventory.dto");
const sequence_generator_service_1 = require("../../../common/services/sequence-generator.service");
const currencies_service_1 = require("../../finance/currencies/currencies.service");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const items_reports_service_1 = require("./items-reports.service");
let ItemsTransactionsService = class ItemsTransactionsService {
    constructor(itemRepo, itemTypeRepo, qtyTypeRepo, codeGroupRepo, stockRepo, sequenceGenerator, currenciesService, transactionContext, reportsService) {
        this.itemRepo = itemRepo;
        this.itemTypeRepo = itemTypeRepo;
        this.qtyTypeRepo = qtyTypeRepo;
        this.codeGroupRepo = codeGroupRepo;
        this.stockRepo = stockRepo;
        this.sequenceGenerator = sequenceGenerator;
        this.currenciesService = currenciesService;
        this.transactionContext = transactionContext;
        this.reportsService = reportsService;
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        if (!dto.currencyId) {
            try {
                const defaultCurrency = await this.currenciesService.getDefault();
                dto.currencyId = String(defaultCurrency.id);
            }
            catch (error) { }
        }
        if (!dto.itemCodeGroupId) {
            throw new common_1.BadRequestException('Ürün oluşturulurken bir Kod Grubu seçilmelidir.');
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
        const item = await this.reportsService.findOne(id);
        const updateData = {
            updatedBy: userId || null
        };
        const updatableFields = [
            'name', 'itemTypeId', 'itemCodeGroupId', 'code', 'code1', 'code2',
            'image', 'currencyId', 'quantityTypeId', 'description', 'notes',
            'providerId', 'state', 'criticalLimit', 'purchasePrice', 'salePrice',
            'netPrice', 'kdv'
        ];
        updatableFields.forEach(field => {
            if (dto[field] !== undefined)
                updateData[field] = dto[field];
        });
        if (dto.state === 0 && item.state !== 0) {
            await this.validateUsage(id);
        }
        await this.itemRepo.update(id, updateData);
        return this.reportsService.findOne(id);
    }
    async importItems(items, userId) {
        const manager = this.transactionContext.manager;
        let updatedCount = 0;
        let insertedCount = 0;
        const errors = [];
        const [itemTypes, qtyTypes, codeGroups, currencies, departments, defaultCurrency] = await Promise.all([
            manager.find(item_type_entity_1.ItemType, { where: { state: 1 } }),
            manager.find(quantity_type_entity_1.QuantityType, { where: { state: 1 } }),
            manager.find(item_code_group_entity_1.ItemCodeGroup, { where: { state: 1 } }),
            manager.find(currency_entity_1.Currency, { where: { state: 1 } }),
            manager.find(department_entity_1.Department, { where: { state: 1 } }),
            this.currenciesService.getDefault()
        ]);
        const defaultCurrencyId = defaultCurrency ? String(defaultCurrency.id) : null;
        if (itemTypes.length === 0 || qtyTypes.length === 0) {
            throw new common_1.BadRequestException('Sistemde tanımlı Ürün Tipi veya Birim bulunamadı. İçe aktarım yapılamaz.');
        }
        const typeMap = new Map(itemTypes.map(t => [t.name.trim().toLocaleLowerCase('tr-TR'), String(t.id)]));
        const typeAbbrMap = new Map(itemTypes.map(t => [t.abbreviation.trim().toLocaleLowerCase('tr-TR'), String(t.id)]));
        const qtyMap = new Map(qtyTypes.map(q => [q.name.trim().toLocaleLowerCase('tr-TR'), String(q.id)]));
        const qtyAbbrMap = new Map(qtyTypes.map(q => [q.abbreviation.trim().toLocaleLowerCase('tr-TR'), String(q.id)]));
        const currencyMap = new Map(currencies.map(c => [c.code.trim().toUpperCase(), String(c.id)]));
        const defaultTypeId = String(itemTypes[0]?.id);
        const defaultQtyId = String(qtyTypes[0]?.id);
        const targetCodes = [];
        const rowCodeMap = new Map();
        for (const [index, row] of items.entries()) {
            if (row.code?.trim()) {
                const c = row.code.trim();
                targetCodes.push(c);
                rowCodeMap.set(index, c);
            }
            else if (row.codeGroup?.trim() && row.codeSequence?.trim()) {
                const cleanGroup = row.codeGroup.trim().toLowerCase();
                const cg = codeGroups.find(g => g.prefix.toLowerCase() === cleanGroup ||
                    g.name.toLowerCase() === cleanGroup);
                if (cg) {
                    const paddedSeq = row.codeSequence.trim().padStart(3, '0');
                    const code = `${cg.prefix}-${paddedSeq}`;
                    targetCodes.push(code);
                    rowCodeMap.set(index, code);
                }
            }
        }
        const existingItems = targetCodes.length > 0
            ? await manager.find(item_entity_1.Item, { where: { code: (0, typeorm_2.In)(targetCodes) } })
            : [];
        const existingMap = new Map(existingItems.map(i => [i.code, i]));
        const newItemsToSave = [];
        const itemsToUpdate = [];
        for (const [index, row] of items.entries()) {
            if (!row.name?.trim()) {
                errors.push(`Satır ${index + 2}: 'Ürün Adı' hücresi boş olamaz.`);
                continue;
            }
            let typeId = defaultTypeId;
            if (row.typeName?.trim()) {
                const cleanType = row.typeName.trim().toLocaleLowerCase('tr-TR');
                const found = typeMap.get(cleanType) || typeAbbrMap.get(cleanType);
                if (found) {
                    typeId = found;
                }
                else {
                    errors.push(`Satır ${index + 2}: Belirtilen Ürün Tipi '${row.typeName}' sistemde tanımlı değil. Varsayılan Ürün Tipi '${itemTypes[0]?.name}' olarak ayarlandı.`);
                }
            }
            let qtyId = defaultQtyId;
            if (row.unitName?.trim()) {
                const cleanUnit = row.unitName.trim().toLocaleLowerCase('tr-TR');
                const found = qtyMap.get(cleanUnit) || qtyAbbrMap.get(cleanUnit);
                if (found) {
                    qtyId = found;
                }
                else {
                    errors.push(`Satır ${index + 2}: Belirtilen Birim '${row.unitName}' sistemde tanımlı değil. Varsayılan Birim '${qtyTypes[0]?.abbreviation}' olarak ayarlandı.`);
                }
            }
            let currencyId = defaultCurrencyId;
            if (row.currencyCode?.trim()) {
                const cleanCurr = row.currencyCode.trim().toUpperCase();
                const found = currencyMap.get(cleanCurr);
                if (found) {
                    currencyId = found;
                }
                else {
                    const defaultCurrCode = defaultCurrency?.code || 'TRY';
                    errors.push(`Satır ${index + 2}: Belirtilen Para Birimi '${row.currencyCode}' sistemde tanımlı değil. Varsayılan Para Birimi '${defaultCurrCode}' olarak ayarlandı.`);
                }
            }
            const formedCode = rowCodeMap.get(index);
            const existing = formedCode ? existingMap.get(formedCode) : null;
            if (existing) {
                existing.name = row.name.trim().toLocaleUpperCase('tr-TR');
                existing.itemTypeId = typeId;
                existing.quantityTypeId = qtyId;
                existing.currencyId = currencyId;
                if (row.purchasePrice !== undefined)
                    existing.purchasePrice = new decimal_js_1.Decimal(row.purchasePrice);
                if (row.salePrice !== undefined)
                    existing.salePrice = new decimal_js_1.Decimal(row.salePrice);
                if (row.kdv !== undefined)
                    existing.kdv = new decimal_js_1.Decimal(row.kdv);
                if (row.criticalLimit !== undefined)
                    existing.criticalLimit = new decimal_js_1.Decimal(row.criticalLimit);
                if (row.description !== undefined)
                    existing.description = row.description?.trim() || null;
                existing.updatedBy = userId;
                itemsToUpdate.push(existing);
                updatedCount++;
            }
            else {
                if (row.codeSequence?.trim()) {
                    errors.push(`Satır ${index + 2}: '${formedCode || row.codeSequence}' kodlu mevcut bir ürün bulunamadı. Yeni bir ürün eklemek istiyorsanız Kod Sekansı alanını boş bırakın.`);
                    continue;
                }
                if (!row.codeGroup?.trim()) {
                    errors.push(`Satır ${index + 2}: Yeni ürün eklemek için 'Kod Grubu' belirtilmesi zorunludur.`);
                    continue;
                }
                const cleanGroup = row.codeGroup.trim().toLowerCase();
                const cg = codeGroups.find(g => g.prefix.toLowerCase() === cleanGroup ||
                    g.name.toLowerCase() === cleanGroup);
                if (!cg) {
                    errors.push(`Satır ${index + 2}: Belirtilen Kod Grubu '${row.codeGroup}' sistemde bulunamadı.`);
                    continue;
                }
                let newCode;
                try {
                    newCode = await this.sequenceGenerator.generateItemCode(manager, String(cg.id));
                }
                catch (seqErr) {
                    errors.push(`Satır ${index + 2}: Kod sekansı üretilirken sistem hatası oluştu: ${seqErr.message}`);
                    continue;
                }
                const newItem = manager.create(item_entity_1.Item, {
                    code: newCode,
                    name: row.name.trim().toLocaleUpperCase('tr-TR'),
                    itemTypeId: typeId,
                    itemCodeGroupId: String(cg.id),
                    quantityTypeId: qtyId,
                    currencyId,
                    purchasePrice: new decimal_js_1.Decimal(row.purchasePrice || 0),
                    salePrice: new decimal_js_1.Decimal(row.salePrice || 0),
                    kdv: new decimal_js_1.Decimal(row.kdv ?? 20),
                    criticalLimit: new decimal_js_1.Decimal(row.criticalLimit || 0),
                    movingAverageCost: new decimal_js_1.Decimal(0),
                    description: row.description?.trim() || null,
                    createdBy: userId,
                });
                newItemsToSave.push(newItem);
                insertedCount++;
            }
        }
        try {
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
        }
        catch (dbErr) {
            throw new common_1.BadRequestException(`Veritabanı kayıt işlemi başarısız oldu: ${dbErr.message}`);
        }
        return { updatedCount, insertedCount, errors };
    }
    async importFromExcel(buffer, userId) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new common_1.BadRequestException('Excel dosyasında geçerli bir çalışma sayfası bulunamadı.');
        }
        const items = [];
        const errors = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const codeGroup = row.getCell(1).text?.trim();
            const codeSequence = row.getCell(2).text?.trim();
            const name = row.getCell(3).text?.trim();
            const typeName = row.getCell(4).text?.trim();
            const unitName = row.getCell(5).text?.trim();
            const purchasePriceStr = row.getCell(6).text?.trim();
            const salePriceStr = row.getCell(7).text?.trim();
            const criticalLimitStr = row.getCell(8).text?.trim();
            const kdvStr = row.getCell(9).text?.trim();
            const currencyCode = row.getCell(10).text?.trim();
            const description = row.getCell(11).text?.trim();
            if (!codeGroup && !codeSequence && !name && !typeName && !unitName) {
                return;
            }
            const parseNumber = (val, colName, rowNum) => {
                if (!val)
                    return 0;
                const clean = val.replace(/\s/g, '').replace(/,/g, '.');
                const num = parseFloat(clean);
                if (isNaN(num)) {
                    errors.push(`Satır ${rowNum}: '${colName}' geçersiz sayı formatı içeriyor: '${val}'. Değer '0' olarak kabul edildi.`);
                    return 0;
                }
                return num;
            };
            const purchasePrice = parseNumber(purchasePriceStr, 'Alış Fiyatı', rowNumber);
            const salePrice = parseNumber(salePriceStr, 'Satış Fiyatı', rowNumber);
            const criticalLimit = parseNumber(criticalLimitStr, 'Kritik Limit', rowNumber);
            const kdv = kdvStr ? parseNumber(kdvStr, 'KDV', rowNumber) : 20;
            items.push({
                codeGroup: codeGroup || undefined,
                codeSequence: codeSequence || undefined,
                name: name || '',
                typeName: typeName || undefined,
                unitName: unitName || undefined,
                purchasePrice,
                salePrice,
                criticalLimit,
                kdv,
                currencyCode: currencyCode || undefined,
                description: description || undefined
            });
        });
        if (items.length === 0) {
            throw new common_1.BadRequestException('Excel dosyasında aktarılacak herhangi bir ürün satırı bulunamadı.');
        }
        const importResult = await this.importItems(items, userId);
        importResult.errors = [...errors, ...importResult.errors];
        return importResult;
    }
    async softDelete(id, currentUserId) {
        await this.reportsService.findOne(id);
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
        if (!totalQty.isZero())
            throw new common_1.BadRequestException(`Stokta ${totalQty.toString()} adet ürün bulunduğu için işlem yapılamaz.`);
        const bomUsage = await manager.count(bom_item_entity_1.BomItem, { where: { itemId: id } });
        if (bomUsage > 0)
            throw new common_1.BadRequestException(`Bu ürün ${bomUsage} adet üretim reçetesinde (BOM) kullanılmaktadır.`);
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
            if (activeItems > 0)
                throw new common_1.BadRequestException(`Bu türde ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
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
        if (activeItems > 0)
            throw new common_1.BadRequestException('Bu türde aktif ürünler bulunduğu için silinemez.');
        await this.itemTypeRepo.softDelete(id);
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
            if (activeItems > 0)
                throw new common_1.BadRequestException(`Bu grupta ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
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
        if (activeItems > 0)
            throw new common_1.BadRequestException('Bu grupta aktif ürünler bulunduğu için silinemez.');
        await this.codeGroupRepo.softDelete(id);
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
            if (activeItems > 0)
                throw new common_1.BadRequestException(`Bu birimi kullanan ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
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
        if (activeItems > 0)
            throw new common_1.BadRequestException('Bu birimi kullanan aktif ürünler bulunduğu için silinemez.');
        await this.qtyTypeRepo.softDelete(id);
    }
};
exports.ItemsTransactionsService = ItemsTransactionsService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateItemDto, String]),
    __metadata("design:returntype", Promise)
], ItemsTransactionsService.prototype, "create", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateItemDto, String]),
    __metadata("design:returntype", Promise)
], ItemsTransactionsService.prototype, "update", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], ItemsTransactionsService.prototype, "importItems", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Buffer, String]),
    __metadata("design:returntype", Promise)
], ItemsTransactionsService.prototype, "importFromExcel", null);
exports.ItemsTransactionsService = ItemsTransactionsService = __decorate([
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
        sequence_generator_service_1.SequenceGeneratorService,
        currencies_service_1.CurrenciesService,
        transaction_context_service_1.TransactionContextService,
        items_reports_service_1.ItemsReportsService])
], ItemsTransactionsService);
//# sourceMappingURL=items-transactions.service.js.map