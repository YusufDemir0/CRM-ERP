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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const items_reports_service_1 = require("./items-reports.service");
const items_transactions_service_1 = require("./items-transactions.service");
let ItemsService = class ItemsService {
    constructor(reportsService, transactionsService) {
        this.reportsService = reportsService;
        this.transactionsService = transactionsService;
    }
    async findAll(query) {
        return this.reportsService.findAll(query);
    }
    async findOne(id) {
        return this.reportsService.findOne(id);
    }
    async getStatus() {
        return this.reportsService.getStatus();
    }
    async exportToExcel(query) {
        return this.reportsService.exportToExcel(query);
    }
    async findAllItemTypes() {
        return this.reportsService.findAllItemTypes();
    }
    async findAllItemCodeGroups() {
        return this.reportsService.findAllItemCodeGroups();
    }
    async findAllQuantityTypes() {
        return this.reportsService.findAllQuantityTypes();
    }
    async create(dto, userId) {
        return this.transactionsService.create(dto, userId);
    }
    async update(id, dto, userId) {
        return this.transactionsService.update(id, dto, userId);
    }
    async importItems(items, userId) {
        return this.transactionsService.importItems(items, userId);
    }
    async softDelete(id, currentUserId) {
        return this.transactionsService.softDelete(id, currentUserId);
    }
    async createItemType(dto, userId) {
        return this.transactionsService.createItemType(dto, userId);
    }
    async updateItemType(id, dto, userId) {
        return this.transactionsService.updateItemType(id, dto, userId);
    }
    async softDeleteItemType(id) {
        return this.transactionsService.softDeleteItemType(id);
    }
    async createItemCodeGroup(dto, userId) {
        return this.transactionsService.createItemCodeGroup(dto, userId);
    }
    async updateItemCodeGroup(id, dto, userId) {
        return this.transactionsService.updateItemCodeGroup(id, dto, userId);
    }
    async softDeleteItemCodeGroup(id) {
        return this.transactionsService.softDeleteItemCodeGroup(id);
    }
    async createQuantityType(dto, userId) {
        return this.transactionsService.createQuantityType(dto, userId);
    }
    async updateQuantityType(id, dto, userId) {
        return this.transactionsService.updateQuantityType(id, dto, userId);
    }
    async softDeleteQuantityType(id) {
        return this.transactionsService.softDeleteQuantityType(id);
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [items_reports_service_1.ItemsReportsService,
        items_transactions_service_1.ItemsTransactionsService])
], ItemsService);
//# sourceMappingURL=items.service.js.map