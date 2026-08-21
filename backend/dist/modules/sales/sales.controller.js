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
    export(query, user) {
        return this.salesService.exportToExcel(query, user);
    }
    findAll(query, user) {
        const hasSalesView = user.isSystemAdmin ||
            user.permissions?.includes('SALES_VIEW_OWN') ||
            user.permissions?.includes('SALES_VIEW_DEPT') ||
            user.permissions?.includes('SALES_VIEW_ALL') ||
            user.permissions?.includes('sales_view_own') ||
            user.permissions?.includes('sales_view_dept') ||
            user.permissions?.includes('sales_view_all');
        const hasCustomerView = user.isSystemAdmin ||
            user.permissions?.includes('PARTIES_VIEW_OWN') ||
            user.permissions?.includes('PARTIES_VIEW_DEPT') ||
            user.permissions?.includes('PARTIES_VIEW_ALL') ||
            user.permissions?.includes('parties_view_own') ||
            user.permissions?.includes('parties_view_dept') ||
            user.permissions?.includes('parties_view_all') ||
            user.permissions?.includes('PARTIES_VIEW_SALES_HISTORY');
        if (hasSalesView || (hasCustomerView && query.partyId)) {
            return this.salesService.findAll(query, user);
        }
        throw new common_1.ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }
    findMinimalLookup(user) {
        return this.salesService.findMinimalLookup(user);
    }
    async findOne(id, user) {
        const hasSalesView = user.isSystemAdmin ||
            user.permissions?.includes('SALES_VIEW_OWN') ||
            user.permissions?.includes('SALES_VIEW_DEPT') ||
            user.permissions?.includes('SALES_VIEW_ALL') ||
            user.permissions?.includes('sales_view_own') ||
            user.permissions?.includes('sales_view_dept') ||
            user.permissions?.includes('sales_view_all');
        const hasCustomerView = user.isSystemAdmin ||
            user.permissions?.includes('PARTIES_VIEW_OWN') ||
            user.permissions?.includes('PARTIES_VIEW_DEPT') ||
            user.permissions?.includes('PARTIES_VIEW_ALL') ||
            user.permissions?.includes('parties_view_own') ||
            user.permissions?.includes('parties_view_dept') ||
            user.permissions?.includes('parties_view_all') ||
            user.permissions?.includes('PARTIES_VIEW_SALES_HISTORY');
        if (hasSalesView || hasCustomerView) {
            return this.salesService.findOne(id);
        }
        throw new common_1.ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }
    create(dto, userId) {
        return this.salesService.create(dto, userId);
    }
    update(id, dto, user) {
        return this.salesService.update(id, dto, String(user.sub), user);
    }
    approve(id, dto, user) {
        return this.salesService.approveSale(id, dto, String(user.sub), user);
    }
    cancel(id, dto, userId) {
        return this.salesService.cancelSale(id, dto.reason, userId);
    }
    revertToDraft(id, userId) {
        return this.salesService.revertToDraft(id, userId);
    }
    ship(id, dto, userId) {
        return this.salesService.shipSale(id, dto, userId);
    }
    remove(id, user) {
        return this.salesService.softDelete(id, String(user.sub), user);
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
    (0, permissions_decorator_1.RequirePermissions)('SALES_VIEW_OWN', 'SALES_VIEW_DEPT', 'SALES_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_VIEW_OWN', 'SALES_VIEW_DEPT', 'SALES_VIEW_ALL'),
    (0, common_1.Header)('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="Satis_Raporu.xlsx"'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.SalesQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "export", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.SalesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('minimal-lookup'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findMinimalLookup", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
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
    (0, permissions_decorator_1.RequirePermissions)('SALES_EDIT_OWN', 'SALES_EDIT_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.UpdateSaleDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_APPROVE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ApproveSaleDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_CANCEL'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/revert-to-draft'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_APPROVE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "revertToDraft", null);
__decorate([
    (0, common_1.Post)(':id/ship'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_SHIP'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ShipSaleDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "ship", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('SALES_DELETE_OWN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "remove", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map