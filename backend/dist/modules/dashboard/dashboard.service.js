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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../auth/entities/user.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const item_entity_1 = require("../inventory/items/entities/item.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const department_entity_1 = require("../departments/entities/department.entity");
const date_utils_1 = require("../../common/utils/date.utils");
let DashboardService = class DashboardService {
    constructor(userRepo, partyRepo, itemRepo, txRepo, deptRepo) {
        this.userRepo = userRepo;
        this.partyRepo = partyRepo;
        this.itemRepo = itemRepo;
        this.txRepo = txRepo;
        this.deptRepo = deptRepo;
        this.cache = null;
        this.CACHE_TTL = 5 * 60 * 1000;
    }
    async getSummary() {
        const now = Date.now();
        if (this.cache && (now - this.cache.timestamp) < this.CACHE_TTL) {
            return this.cache.data;
        }
        const [users, parties, items, transactions, departments] = await Promise.all([
            this.userRepo.count(),
            this.partyRepo.count(),
            this.itemRepo.count(),
            this.txRepo.count(),
            this.deptRepo.count(),
        ]);
        const criticalStocks = await this.itemRepo.count({ where: { state: 1 } });
        const result = {
            users,
            parties,
            items,
            transactions,
            departments,
            criticalStocks,
            cachedAt: date_utils_1.DateUtils.getToday(),
        };
        this.cache = { data: result, timestamp: now };
        return result;
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map