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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ExcelJS = __importStar(require("exceljs"));
const dayjs_1 = __importDefault(require("dayjs"));
const decimal_js_1 = require("decimal.js");
const sale_entity_1 = require("./entities/sale.entity");
const sale_type_entity_1 = require("./entities/sale-type.entity");
const item_entity_1 = require("../inventory/items/entities/item.entity");
const sql_helper_1 = require("../../common/utils/sql.helper");
const date_utils_1 = require("../../common/utils/date.utils");
let SalesReportsService = class SalesReportsService {
    constructor(saleRepo, saleTypeRepo) {
        this.saleRepo = saleRepo;
        this.saleTypeRepo = saleTypeRepo;
    }
    async findAllSaleTypes() {
        return this.saleTypeRepo.find();
    }
    async findMinimalLookup(user) {
        const qb = this.saleRepo.createQueryBuilder('sale')
            .leftJoin('sale.party', 'party')
            .select([
            'sale.id',
            'sale.code',
            'sale.grandTotal',
            'sale.phone',
            'party.id',
            'party.name',
            'party.phone1'
        ]);
        if (user && !user.isSystemAdmin) {
            if (user.permissions?.includes('SALES_VIEW_ALL') || user.permissions?.includes('SALES_MASTER_VIEW') || user.permissions?.includes('sales_view_all') || user.permissions?.includes('sales_master_view')) {
            }
            else if (user.permissions?.includes('SALES_VIEW_DEPT') || user.permissions?.includes('sales_view_dept')) {
                if (user.departmentId) {
                    qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
                }
                else {
                    qb.andWhere('1 = 0');
                }
            }
            else {
                qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
            }
        }
        return qb.orderBy('sale.createdAt', 'DESC')
            .limit(1000)
            .getMany();
    }
    async findAll(query, user) {
        const qb = this.saleRepo.createQueryBuilder('sale')
            .select([
            'sale.id', 'sale.code', 'sale.status', 'sale.totalAmount', 'sale.grandTotal',
            'sale.kdv', 'sale.discountAmount', 'sale.createdAt', 'sale.updatedAt',
            'sale.deliveryDate', 'sale.phone', 'sale.address', 'sale.profit',
            'sale.maturityDays', 'sale.paymentType', 'sale.installments', 'sale.paidAmount',
            'sale.commercialAccountId', 'sale.city', 'sale.district', 'sale.notes', 'sale.email',
            'sale.source', 'sale.deposit'
        ])
            .leftJoin('sale.party', 'party')
            .addSelect(['party.id', 'party.name', 'party.type', 'party.balance', 'party.creditLimit'])
            .leftJoin('sale.saleType', 'saleType')
            .addSelect(['saleType.id', 'saleType.name', 'saleType.abbreviation'])
            .leftJoin('sale.currency', 'currency')
            .addSelect(['currency.id', 'currency.symbol', 'currency.code'])
            .leftJoin('sale.department', 'department')
            .addSelect(['department.id', 'department.name', 'department.abbreviation'])
            .leftJoin('sale.commercialAccount', 'commercialAccount')
            .addSelect(['commercialAccount.id', 'commercialAccount.name', 'commercialAccount.bankName']);
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            if (s) {
                qb.andWhere('(sale.code LIKE :s OR sale.notes LIKE :s OR sale.phone LIKE :s OR sale.address LIKE :s OR sale.city LIKE :s OR sale.district LIKE :s OR sale.taxNumber LIKE :s OR sale.email LIKE :s OR sale.source LIKE :s OR party.name LIKE :s)', { s });
            }
        }
        if (query.status)
            qb.andWhere('sale.status = :status', { status: query.status });
        if (query.partyId)
            qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });
        if (query.departmentId)
            qb.andWhere('sale.departmentId = :departmentId', { departmentId: query.departmentId });
        if (user && !user.isSystemAdmin) {
            const forceOwnSales = query.ownSalesOnly === 'true' || query.ownSalesOnly === true;
            if (forceOwnSales) {
                qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
            }
            else if (user.permissions?.includes('SALES_VIEW_ALL')) {
            }
            else if (user.permissions?.includes('PARTIES_VIEW_SALES_HISTORY') && query.partyId) {
            }
            else if (user.permissions?.includes('SALES_VIEW_DEPT')) {
                if (user.departmentId) {
                    qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
                }
                else {
                    qb.andWhere('1 = 0');
                }
            }
            else {
                qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
            }
        }
        const allowedSortMap = {
            'code': 'sale.code',
            'createdAt': 'sale.createdAt',
            'grandTotal': 'sale.grandTotal',
            'status': 'sale.status',
            'party.name': 'party.name',
            'saleType.name': 'saleType.name'
        };
        const sortField = allowedSortMap[query.sortBy || ''] || 'sale.createdAt';
        qb.orderBy(sortField, query.sortOrderSafe);
        if (sortField !== 'sale.createdAt') {
            qb.addOrderBy('sale.createdAt', 'DESC');
        }
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id, manager) {
        const repo = manager ? manager.getRepository(sale_entity_1.Sale) : this.saleRepo;
        const sale = await repo.findOne({
            where: { id },
            relations: ['party', 'saleType', 'currency', 'staff', 'commercialAccount', 'department', 'items', 'items.item', 'cancelledBy'],
        });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        return sale;
    }
    async getStatus() {
        const firstDayOfMonth = (0, dayjs_1.default)().startOf('month').toDate();
        const [stats, pending] = await Promise.all([
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
                .addSelect("COUNT(*)", "total")
                .where("sale.createdAt >= :date", { date: date_utils_1.DateUtils.getStartOfDay(firstDayOfMonth) })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne(),
            this.saleRepo.count({ where: { status: 'draft' } }),
        ]);
        return {
            monthlyRevenue: new decimal_js_1.Decimal(stats?.revenue || 0),
            monthlyOrders: new decimal_js_1.Decimal(stats?.total || 0),
            pendingOrders: new decimal_js_1.Decimal(pending || 0),
        };
    }
    async exportToExcel(query, user) {
        const qb = this.saleRepo.createQueryBuilder('sale')
            .leftJoin('sale.party', 'party')
            .leftJoin('sale.currency', 'currency')
            .select([
            'sale.id', 'sale.code', 'sale.createdAt', 'sale.phone',
            'sale.grandTotal', 'sale.status', 'sale.deliveryDate', 'sale.profit',
            'party.id', 'party.name', 'party.phone1',
            'currency.id', 'currency.symbol'
        ]);
        if (query.status)
            qb.andWhere('sale.status = :status', { status: query.status });
        if (user && !user.isSystemAdmin) {
            const hasViewAll = user.permissions?.includes('SALES_VIEW_ALL') ||
                user.permissions?.includes('sales_view_all') ||
                user.permissions?.includes('SALES_MASTER_VIEW') ||
                user.permissions?.includes('sales_master_view');
            if (hasViewAll) {
            }
            else {
                const hasViewDept = user.permissions?.includes('SALES_VIEW_DEPT') ||
                    user.permissions?.includes('sales_view_dept') ||
                    user.permissions?.includes('SALES_APPROVE') ||
                    user.permissions?.includes('sales_approve') ||
                    user.permissions?.includes('SALES_MASTER_APPROVE') ||
                    user.permissions?.includes('sales_master_approve');
                if (hasViewDept && user.departmentId) {
                    qb.andWhere('sale.departmentId = :userDeptId', { userDeptId: user.departmentId });
                }
                else {
                    qb.andWhere('sale.createdBy = :userId', { userId: user.sub });
                }
            }
        }
        const sales = await qb.getMany();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Satislar');
        worksheet.columns = [
            { header: 'Satış No', key: 'code', width: 15 },
            { header: 'Tarih', key: 'date', width: 15 },
            { header: 'Müşteri', key: 'party', width: 25 },
            { header: 'Telefon', key: 'phone', width: 15 },
            { header: 'Tutar', key: 'total', width: 15 },
            { header: 'Döviz', key: 'currency', width: 10 },
            { header: 'Durum', key: 'status', width: 15 },
            { header: 'Teslimat', key: 'delivery', width: 15 },
            { header: 'Kar/Zarar', key: 'profit', width: 15 },
        ];
        const statusMap = {
            'draft': 'Taslak',
            'approved': 'Onaylandı',
            'shipped': 'Sevk Edildi',
            'invoiced': 'Faturalandı',
            'cancelled': 'İptal'
        };
        sales.forEach(s => {
            worksheet.addRow({
                code: s.code,
                date: (0, dayjs_1.default)(s.createdAt).format('DD.MM.YYYY'),
                party: s.party?.name || '—',
                phone: s.phone || s.party?.phone1 || '—',
                total: s.grandTotal.toNumber(),
                currency: s.currency?.symbol || '₺',
                status: statusMap[s.status] || s.status,
                delivery: s.deliveryDate || '—',
                profit: s.profit.toNumber(),
            });
        });
        worksheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        return new common_1.StreamableFile(Buffer.from(buffer));
    }
    async fetchItemData(manager, itemIds) {
        const items = await manager.find(item_entity_1.Item, {
            where: { id: (0, typeorm_2.In)(itemIds), state: 1 }
        });
        if (items.length !== itemIds.length) {
            const foundIds = items.map(i => i.id);
            const missing = itemIds.filter(id => !foundIds.includes(id));
            throw new common_1.NotFoundException(`Bazı ürünler bulunamadı veya pasif: ${missing.join(', ')}`);
        }
        const map = new Map();
        items.forEach(i => map.set(i.id, {
            id: i.id,
            salePrice: i.salePrice || 0,
            purchasePrice: i.purchasePrice || 0
        }));
        return map;
    }
};
exports.SalesReportsService = SalesReportsService;
exports.SalesReportsService = SalesReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_type_entity_1.SaleType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SalesReportsService);
//# sourceMappingURL=sales-reports.service.js.map