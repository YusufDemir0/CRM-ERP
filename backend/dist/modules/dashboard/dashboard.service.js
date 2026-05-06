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
        const [totalCustomers, totalSalesCount, todayRevenueStats, thisMonthStats, lastMonthStats,] = await Promise.all([
            this.partyRepo.count({
                where: {
                    state: 1,
                    type: 'customer',
                    createdBy: user?.sub
                }
            }),
            this.saleRepo.count({
                where: { status: (0, typeorm_2.Between)('approved', 'shipped') }
            }),
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
                .where("sale.createdAt BETWEEN :start AND :end", { start: todayStart, end: todayEnd })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne(),
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .addSelect("SUM(sale.profit * sale.exchangeRate)", "profit")
                .addSelect("COUNT(*)", "count")
                .where("sale.createdAt BETWEEN :start AND :end", { start: thisMonthStart, end: thisMonthEnd })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne(),
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .addSelect("SUM(sale.profit * sale.exchangeRate)", "profit")
                .addSelect("COUNT(*)", "count")
                .where("sale.createdAt BETWEEN :start AND :end", { start: lastMonthStart, end: lastMonthEnd })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne()
        ]);
        return {
            totalCustomers,
            totalSalesCount,
            todaySales: todayRevenueStats.revenue || 0,
            thisMonth: {
                revenue: thisMonthStats.revenue || 0,
                count: thisMonthStats.count || 0,
                profit: thisMonthStats.profit || 0
            },
            lastMonth: {
                revenue: lastMonthStats.revenue || 0,
                count: lastMonthStats.count || 0,
                profit: lastMonthStats.profit || 0
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