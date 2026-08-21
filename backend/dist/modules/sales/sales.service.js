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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const sales_reports_service_1 = require("./sales-reports.service");
const sales_transactions_service_1 = require("./sales-transactions.service");
let SalesService = SalesService_1 = class SalesService {
    constructor(reportsService, transactionsService) {
        this.reportsService = reportsService;
        this.transactionsService = transactionsService;
        this.logger = new common_1.Logger(SalesService_1.name);
    }
    async findAllSaleTypes() {
        return this.reportsService.findAllSaleTypes();
    }
    async findAll(query, user) {
        return this.reportsService.findAll(query, user);
    }
    async findMinimalLookup(user) {
        return this.reportsService.findMinimalLookup(user);
    }
    async findOne(id) {
        return this.reportsService.findOne(id);
    }
    async getStatus() {
        return this.reportsService.getStatus();
    }
    async exportToExcel(query, user) {
        return this.reportsService.exportToExcel(query, user);
    }
    async createSaleType(dto, userId) {
        return this.transactionsService.createSaleType(dto, userId);
    }
    async create(dto, userId) {
        return this.transactionsService.create(dto, userId);
    }
    async update(id, dto, userId, user) {
        return this.transactionsService.update(id, dto, userId, user);
    }
    async approveSale(saleId, dto, userId, user) {
        return this.transactionsService.approveSale(saleId, dto, userId, user);
    }
    async cancelSale(saleId, reason, userId) {
        return this.transactionsService.cancelSale(saleId, reason, userId);
    }
    async revertToDraft(saleId, userId) {
        return this.transactionsService.revertToDraft(saleId, userId);
    }
    async shipSale(saleId, dto, userId) {
        return this.transactionsService.shipSale(saleId, dto, userId);
    }
    async softDelete(id, userId, user) {
        return this.transactionsService.softDelete(id, userId, user);
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_reports_service_1.SalesReportsService,
        sales_transactions_service_1.SalesTransactionsService])
], SalesService);
//# sourceMappingURL=sales.service.js.map