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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const sale_dto_1 = require("./dto/sale.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let SalesController = class SalesController {
    constructor(salesService) {
        this.salesService = salesService;
    }
    findAllSaleTypes() { return this.salesService.findAllSaleTypes(); }
    createSaleType(dto, userId) {
        return this.salesService.createSaleType(dto, userId);
    }
    getStatus() {
        return this.salesService.getStatus();
    }
    export(query, user, res) {
        return this.salesService.exportToExcel(query, user, res);
    }
    findAll(query, user) {
        return this.salesService.findAll(query, user);
    }
    findOne(id) {
        return this.salesService.findOne(id);
    }
    create(dto, userId) {
        return this.salesService.create(dto, userId);
    }
    update(id, dto, userId) {
        return this.salesService.update(id, dto, userId);
    }
    approve(id, dto, userId) {
        return this.salesService.approveSale(id, dto, userId);
    }
    cancel(id, userId) {
        return this.salesService.cancelSale(id, userId);
    }
    ship(id, dto, userId) {
        return this.salesService.shipSale(id, dto, userId);
    }
    remove(id) {
        return this.salesService.softDelete(id);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Get)('types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllSaleTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.CreateSaleTypeDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createSaleType", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_VIEW'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_VIEW'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.SalesQueryDto, Object, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "export", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('SALES_VIEW'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.SalesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('SALES_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.CreateSaleDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.UpdateSaleDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_MASTER_APPROVE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ApproveSaleDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_MASTER_CANCEL'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/ship'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_MASTER_SHIP'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ShipSaleDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "ship", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "remove", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map