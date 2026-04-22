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
const class_transformer_1 = require("class-transformer");
const dashboard_summary_dto_1 = require("./dto/dashboard-summary.dto");
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
    async getSummary() {
        const now = (0, dayjs_1.default)();
        const todayStr = now.format('YYYY-MM-DD');
        const thisMonthStart = now.startOf('month').toDate();
        const thisMonthEnd = now.toDate();
        const lastMonthStart = now.subtract(1, 'month').startOf('month').toDate();
        const lastMonthEnd = now.subtract(1, 'month').toDate();
        const [totalUsers, totalParties, totalItems, thisMonthStats, lastMonthStats, recentActions] = await Promise.all([
            this.userRepo.count({ where: { state: 1 } }),
            this.partyRepo.count({ where: { state: 1 } }),
            this.itemRepo.count({ where: { state: 1 } }),
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .addSelect("COUNT(*)", "count")
                .where("sale.createdAt BETWEEN :start AND :end", { start: thisMonthStart, end: thisMonthEnd })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne(),
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate - sale.kdv * sale.exchangeRate)", "revenue")
                .addSelect("COUNT(*)", "count")
                .where("sale.createdAt BETWEEN :start AND :end", { start: lastMonthStart, end: lastMonthEnd })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne(),
            this.txRepo.find({
                relations: ['party'],
                order: { createdAt: 'DESC' },
                take: 10
            })
        ]);
        return (0, class_transformer_1.plainToInstance)(dashboard_summary_dto_1.DashboardSummaryDto, {
            totalUsers,
            totalParties,
            totalItems,
            todaySales: 0,
            thisMonth: {
                revenue: thisMonthStats.revenue,
                count: thisMonthStats.count,
                profit: 0
            },
            lastMonth: {
                revenue: lastMonthStats.revenue,
                count: lastMonthStats.count,
                profit: 0
            },
            recentActions: recentActions.map(tx => ({
                id: tx.id,
                code: tx.code,
                type: tx.type,
                amount: tx.amount?.toString() || '0',
                date: tx.date,
                partyName: tx.party?.name || 'Genel İşlem',
                referenceType: tx.referenceType,
                description: tx.description
            }))
        });
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