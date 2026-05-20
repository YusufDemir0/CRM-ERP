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
var StocksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StocksService = void 0;
const common_1 = require("@nestjs/common");
const stocks_reports_service_1 = require("./stocks-reports.service");
const stocks_transactions_service_1 = require("./stocks-transactions.service");
let StocksService = StocksService_1 = class StocksService {
    constructor(reportsService, transactionsService) {
        this.reportsService = reportsService;
        this.transactionsService = transactionsService;
        this.logger = new common_1.Logger(StocksService_1.name);
    }
    async findAll(query) {
        return this.reportsService.findAll(query);
    }
    async findAllMovements(query) {
        return this.reportsService.findAllMovements(query);
    }
    async getMovements(stockId, query) {
        return this.reportsService.getMovements(stockId, query);
    }
    async getCriticalStocks(query = {}) {
        if (query.limit) {
            return this.reportsService.getCriticalStocks(query);
        }
        const res = await this.reportsService.getCriticalStocks({ page: 1, limit: 100000 });
        return res.data;
    }
    async getStockReport() {
        return this.reportsService.getStockReport();
    }
    async getStatus() {
        return this.reportsService.getStatus();
    }
    async decreaseStock(itemId, departmentId, quantity, manager, referenceInfo, userId) {
        return this.transactionsService.decreaseStock(itemId, departmentId, quantity, manager, referenceInfo, userId);
    }
    async decreaseStockBulk(items, departmentId, manager, referenceInfo, userId) {
        return this.transactionsService.decreaseStockBulk(items, departmentId, manager, referenceInfo, userId);
    }
    async reserveStockBulk(items, departmentId, manager, referenceInfo, userId) {
        return this.transactionsService.reserveStockBulk(items, departmentId, manager, referenceInfo, userId);
    }
    async unreserveStockBulk(items, departmentId, manager, userId) {
        return this.transactionsService.unreserveStockBulk(items, departmentId, manager, userId);
    }
    async finalizeShipmentBulk(items, departmentId, manager, referenceInfo, userId) {
        return this.transactionsService.finalizeShipmentBulk(items, departmentId, manager, referenceInfo, userId);
    }
    async increaseStock(itemId, departmentId, quantity, inUnitCost, manager, referenceInfo, userId) {
        return this.transactionsService.increaseStock(itemId, departmentId, quantity, inUnitCost, manager, referenceInfo, userId);
    }
    async adjustStock(dto, userId) {
        return this.transactionsService.adjustStock(dto, userId);
    }
    async transferStock(dto, userId) {
        return this.transactionsService.transferStock(dto, userId);
    }
    async revertStockMovementsByReference(referenceType, referenceId, manager, userId) {
        return this.transactionsService.revertStockMovementsByReference(referenceType, referenceId, manager, userId);
    }
};
exports.StocksService = StocksService;
exports.StocksService = StocksService = StocksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stocks_reports_service_1.StocksReportsService,
        stocks_transactions_service_1.StocksTransactionsService])
], StocksService);
//# sourceMappingURL=stocks.service.js.map