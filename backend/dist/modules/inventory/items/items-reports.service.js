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
exports.ItemsReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ExcelJS = __importStar(require("exceljs"));
const item_entity_1 = require("./entities/item.entity");
const item_type_entity_1 = require("./entities/item-type.entity");
const quantity_type_entity_1 = require("./entities/quantity-type.entity");
const item_code_group_entity_1 = require("./entities/item-code-group.entity");
const currency_entity_1 = require("../../finance/currencies/entities/currency.entity");
const sql_helper_1 = require("../../../common/utils/sql.helper");
let ItemsReportsService = class ItemsReportsService {
    constructor(itemRepo, itemTypeRepo, qtyTypeRepo, codeGroupRepo) {
        this.itemRepo = itemRepo;
        this.itemTypeRepo = itemTypeRepo;
        this.qtyTypeRepo = qtyTypeRepo;
        this.codeGroupRepo = codeGroupRepo;
    }
    async findAll(query) {
        const qb = this.itemRepo.createQueryBuilder('item')
            .leftJoin('item.itemType', 'itemType')
            .leftJoin('item.quantityType', 'quantityType')
            .leftJoin('item.provider', 'provider')
            .leftJoin('item.currency', 'currency')
            .leftJoin('item.itemCodeGroup', 'itemCodeGroup')
            .leftJoin('item.stocks', 'stocks')
            .leftJoin('stocks.department', 'stockDepartment')
            .select([
            'item.id', 'item.name', 'item.code', 'item.code1', 'item.code2',
            'item.purchasePrice', 'item.salePrice', 'item.totalStock',
            'item.criticalLimit', 'item.state', 'item.createdAt', 'item.kdv', 'item.description',
            'itemType.id', 'itemType.name',
            'quantityType.id', 'quantityType.abbreviation',
            'provider.id', 'provider.name',
            'currency.id', 'currency.symbol', 'currency.code',
            'itemCodeGroup.id', 'itemCodeGroup.prefix', 'itemCodeGroup.name',
            'stocks.id', 'stocks.quantity', 'stocks.reservedQuantity', 'stocks.departmentId',
            'stockDepartment.id', 'stockDepartment.name', 'stockDepartment.abbreviation'
        ]);
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            if (s) {
                qb.andWhere('(item.name LIKE :s OR item.code LIKE :s OR item.code1 LIKE :s OR item.code2 LIKE :s OR item.description LIKE :s OR item.notes LIKE :s)', { s });
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
    async findOne(id, manager) {
        const repo = manager ? manager.getRepository(item_entity_1.Item) : this.itemRepo;
        const item = await repo.findOne({
            where: { id: String(id) },
            relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
        });
        if (!item)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        return item;
    }
    async findAllItemTypes() {
        return this.itemTypeRepo.find();
    }
    async findAllItemCodeGroups() {
        return this.codeGroupRepo.find();
    }
    async findAllQuantityTypes() {
        return this.qtyTypeRepo.find();
    }
    async getStatus() {
        const [active, passive, lowStock] = await Promise.all([
            this.itemRepo.count({ where: { state: 1 } }),
            this.itemRepo.count({ where: { state: 0 } }),
            this.itemRepo.createQueryBuilder('item').where('item.state = 1 AND item.criticalLimit > 0').getCount(),
        ]);
        return { active, passive, total: active + passive, lowStock };
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
    async getImportTemplate() {
        const [codeGroups, currencies, itemTypes, quantityTypes, { data: items }] = await Promise.all([
            this.findAllItemCodeGroups(),
            this.itemTypeRepo.manager.find(currency_entity_1.Currency, { where: { state: 1 } }),
            this.findAllItemTypes(),
            this.findAllQuantityTypes(),
            this.findAll({ limit: 10000 })
        ]);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ürün Toplu Aktarım');
        worksheet.columns = [
            { header: 'Kod Grubu', key: 'codeGroup', width: 15 },
            { header: 'Kod Sekansı', key: 'codeSequence', width: 15 },
            { header: 'Ürün Adı', key: 'name', width: 35 },
            { header: 'Ürün Tipi', key: 'typeName', width: 20 },
            { header: 'Birim', key: 'unitName', width: 15 },
            { header: 'Alış Fiyatı', key: 'purchasePrice', width: 15 },
            { header: 'Satış Fiyatı', key: 'salePrice', width: 15 },
            { header: 'Kritik Limit', key: 'criticalLimit', width: 15 },
            { header: 'KDV', key: 'kdv', width: 10 },
            { header: 'Para Birimi', key: 'currencyCode', width: 15 },
            { header: 'Açıklama', key: 'description', width: 35 },
            { header: '', key: 'spacer', width: 5 },
            { header: 'REFERANS KOD GRUPLARI', key: 'refCodeGroups', width: 30 },
            { header: 'REFERANS PARA BİRİMLERİ', key: 'refCurrencies', width: 30 },
            { header: 'REFERANS ÜRÜN TİPLERİ', key: 'refItemTypes', width: 30 },
            { header: 'REFERANS BİRİM TÜRLERİ', key: 'refQuantityTypes', width: 30 }
        ];
        const rowsData = items.map(item => {
            const prefix = item.itemCodeGroup?.prefix || "";
            let sequence = "";
            let codeGroup = "";
            if (prefix) {
                codeGroup = prefix;
                if (item.code.startsWith(prefix)) {
                    const rest = item.code.substring(prefix.length);
                    sequence = rest.startsWith("-") ? rest.substring(1) : rest;
                }
                else {
                    sequence = item.code;
                }
            }
            else {
                const dashIdx = item.code.indexOf("-");
                if (dashIdx !== -1) {
                    codeGroup = item.code.substring(0, dashIdx);
                    sequence = item.code.substring(dashIdx + 1);
                }
                else {
                    codeGroup = "";
                    sequence = item.code;
                }
            }
            return {
                codeGroup,
                codeSequence: sequence,
                name: item.name,
                typeName: item.itemType?.name || "",
                unitName: item.quantityType?.abbreviation || "",
                purchasePrice: item.purchasePrice !== null && item.purchasePrice !== undefined ? Number(item.purchasePrice) : 0,
                salePrice: item.salePrice !== null && item.salePrice !== undefined ? Number(item.salePrice) : 0,
                criticalLimit: item.criticalLimit !== null && item.criticalLimit !== undefined ? Number(item.criticalLimit) : 0,
                kdv: item.kdv !== null && item.kdv !== undefined ? Number(item.kdv) : 20,
                currencyCode: item.currency?.code || "TRY",
                description: item.description || ""
            };
        });
        if (rowsData.length === 0) {
            rowsData.push({
                codeGroup: "MAM",
                codeSequence: "",
                name: "Örnek Yeni Ürün",
                typeName: "MAMÜL",
                unitName: "ADET",
                purchasePrice: 150.00,
                salePrice: 250.00,
                criticalLimit: 10,
                kdv: 20,
                currencyCode: "TRY",
                description: "Yeni üretilecek ürün"
            });
        }
        const maxRows = Math.max(rowsData.length, codeGroups.length, currencies.length, itemTypes.length, quantityTypes.length);
        for (let i = 0; i < maxRows; i++) {
            const rowData = {};
            if (i < rowsData.length) {
                Object.assign(rowData, rowsData[i]);
            }
            else {
                Object.assign(rowData, {
                    codeGroup: "",
                    codeSequence: "",
                    name: "",
                    typeName: "",
                    unitName: "",
                    purchasePrice: "",
                    salePrice: "",
                    criticalLimit: "",
                    kdv: "",
                    currencyCode: "",
                    description: ""
                });
            }
            rowData.spacer = "";
            if (i < codeGroups.length) {
                const cg = codeGroups[i];
                rowData.refCodeGroups = `${cg.prefix} - ${cg.name}`;
            }
            else {
                rowData.refCodeGroups = "";
            }
            if (i < currencies.length) {
                const cur = currencies[i];
                rowData.refCurrencies = `${cur.code} - ${cur.name || ''}`;
            }
            else {
                rowData.refCurrencies = "";
            }
            if (i < itemTypes.length) {
                const it = itemTypes[i];
                rowData.refItemTypes = it.name;
            }
            else {
                rowData.refItemTypes = "";
            }
            if (i < quantityTypes.length) {
                const qt = quantityTypes[i];
                rowData.refQuantityTypes = `${qt.abbreviation} - ${qt.name}`;
            }
            else {
                rowData.refQuantityTypes = "";
            }
            worksheet.addRow(rowData);
        }
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        for (let col = 1; col <= 11; col++) {
            headerRow.getCell(col).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2C3E50' }
            };
        }
        headerRow.getCell(12).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }
        };
        for (let col = 13; col <= 16; col++) {
            headerRow.getCell(col).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF16A085' }
            };
        }
        worksheet.views = [{ showGridLines: true }];
        const buffer = await workbook.xlsx.writeBuffer();
        return new common_1.StreamableFile(Buffer.from(buffer));
    }
};
exports.ItemsReportsService = ItemsReportsService;
exports.ItemsReportsService = ItemsReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(1, (0, typeorm_1.InjectRepository)(item_type_entity_1.ItemType)),
    __param(2, (0, typeorm_1.InjectRepository)(quantity_type_entity_1.QuantityType)),
    __param(3, (0, typeorm_1.InjectRepository)(item_code_group_entity_1.ItemCodeGroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ItemsReportsService);
//# sourceMappingURL=items-reports.service.js.map