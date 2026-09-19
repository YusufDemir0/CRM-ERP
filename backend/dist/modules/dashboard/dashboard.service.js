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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../auth/entities/user.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const item_entity_1 = require("../inventory/items/entities/item.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const department_entity_1 = require("../departments/entities/department.entity");
const sale_entity_1 = require("../sales/entities/sale.entity");
const decimal_js_1 = require("decimal.js");
const dayjs_1 = __importDefault(require("dayjs"));
let DashboardService = class DashboardService {
    constructor(userRepo, partyRepo, itemRepo, txRepo, deptRepo, saleRepo) {
        this.userRepo = userRepo;
        this.partyRepo = partyRepo;
        this.itemRepo = itemRepo;
        this.txRepo = txRepo;
        this.deptRepo = deptRepo;
        this.saleRepo = saleRepo;
    }
    async getSummary(user) {
        const now = (0, dayjs_1.default)();
        const todayStart = now.startOf('day').toDate();
        const todayEnd = now.endOf('day').toDate();
        const thisMonthStart = now.startOf('month').toDate();
        const thisMonthEnd = now.toDate();
        const lastMonthStart = now.subtract(1, 'month').startOf('month').toDate();
        const lastMonthEnd = now.subtract(1, 'month').toDate();
        const isSystemAdmin = user.isSystemAdmin === true ||
            (!!user.role && ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(user.role.toUpperCase())) ||
            (Array.isArray(user.permissions) && (user.permissions.includes('SALES_VIEW_ALL') || user.permissions.includes('sales_view_all')));
        const userDeptId = user.departmentId ? String(user.departmentId) : null;
        const userId = user.sub ? String(user.sub) : null;
        const confirmedStatuses = ['approved', 'shipped', 'invoiced'];
        const todayQb = this.saleRepo.createQueryBuilder('sale')
            .where("sale.createdAt BETWEEN :start AND :end", { start: todayStart, end: todayEnd })
            .andWhere("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });
        const thisMonthQb = this.saleRepo.createQueryBuilder('sale')
            .where("sale.createdAt BETWEEN :start AND :end", { start: thisMonthStart, end: thisMonthEnd })
            .andWhere("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });
        const lastMonthQb = this.saleRepo.createQueryBuilder('sale')
            .where("sale.createdAt BETWEEN :start AND :end", { start: lastMonthStart, end: lastMonthEnd })
            .andWhere("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });
        const countQb = this.saleRepo.createQueryBuilder('sale')
            .where("sale.status IN (:...confirmedStatuses)", { confirmedStatuses });
        if (!isSystemAdmin) {
            if (userDeptId) {
                todayQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
                thisMonthQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
                lastMonthQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
                countQb.andWhere("sale.departmentId = :deptId", { deptId: userDeptId });
            }
            else {
                todayQb.andWhere("sale.createdBy = :userId", { userId });
                thisMonthQb.andWhere("sale.createdBy = :userId", { userId });
                lastMonthQb.andWhere("sale.createdBy = :userId", { userId });
                countQb.andWhere("sale.createdBy = :userId", { userId });
            }
        }
        const partyWhere = {
            state: 1,
            type: 'customer'
        };
        if (!isSystemAdmin) {
            if (userId) {
                partyWhere.createdBy = userId;
            }
        }
        const [totalCustomers, totalSalesCount, todayRevenueStats, thisMonthStats, lastMonthStats,] = await Promise.all([
            this.partyRepo.count({ where: partyWhere }),
            countQb.getCount(),
            todayQb
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .getRawOne(),
            thisMonthQb
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .addSelect("SUM(sale.profit * sale.exchangeRate)", "profit")
                .addSelect("COUNT(*)", "count")
                .getRawOne(),
            lastMonthQb
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .addSelect("SUM(sale.profit * sale.exchangeRate)", "profit")
                .addSelect("COUNT(*)", "count")
                .getRawOne()
        ]);
        return {
            totalCustomers: Number(totalCustomers || 0),
            totalSalesCount: Number(totalSalesCount || 0),
            todaySales: new decimal_js_1.Decimal(todayRevenueStats?.revenue || 0).toNumber(),
            thisMonth: {
                revenue: new decimal_js_1.Decimal(thisMonthStats?.revenue || 0).toNumber(),
                count: Number(thisMonthStats?.count || 0),
                profit: new decimal_js_1.Decimal(thisMonthStats?.profit || 0).toNumber()
            },
            lastMonth: {
                revenue: new decimal_js_1.Decimal(lastMonthStats?.revenue || 0).toNumber(),
                count: Number(lastMonthStats?.count || 0),
                profit: new decimal_js_1.Decimal(lastMonthStats?.profit || 0).toNumber()
            }
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(party_entity_1.Party)),
    __param(2, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(3, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(4, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(5, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map