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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("./accounts.service");
const finance_dto_1 = require("../dto/finance.dto");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let AccountsController = class AccountsController {
    constructor(accService) {
        this.accService = accService;
    }
    findAll(query, user) {
        const isSelection = String(query.ignorePermissionRestrictions) === 'true';
        if (isSelection) {
            const hasSelect = user.isSystemAdmin ||
                user.permissions?.includes('FINANCE_SELECT_ALL_CASH') ||
                user.permissions?.includes('finance_select_all_cash') ||
                user.permissions?.includes('FINANCE_SELECT_DEPT_CASH') ||
                user.permissions?.includes('finance_select_dept_cash') ||
                user.permissions?.includes('FINANCE_USE_SELECTION') ||
                user.permissions?.includes('finance_use_selection') ||
                user.permissions?.includes('FINANCE_VIEW_ALL') ||
                user.permissions?.includes('finance_view_all') ||
                user.permissions?.includes('FINANCE_VIEW_DEPT') ||
                user.permissions?.includes('finance_view_dept') ||
                user.permissions?.includes('SALES_CREATE') ||
                user.permissions?.includes('sales_create') ||
                user.permissions?.includes('SALES_EDIT_OWN') ||
                user.permissions?.includes('sales_edit_own') ||
                user.permissions?.includes('SALES_EDIT_ALL') ||
                user.permissions?.includes('sales_edit_all') ||
                user.permissions?.includes('SALES_VIEW_OWN') ||
                user.permissions?.includes('sales_view_own') ||
                user.permissions?.includes('SALES_VIEW_DEPT') ||
                user.permissions?.includes('sales_view_dept') ||
                user.permissions?.includes('SALES_VIEW_ALL') ||
                user.permissions?.includes('sales_view_all');
            if (!hasSelect) {
                throw new common_1.ForbiddenException('Satışta kasa/banka seçebilme yetkiniz bulunmamaktadır.');
            }
        }
        else {
            const hasView = user.isSystemAdmin ||
                user.permissions?.includes('FINANCE_VIEW_ALL') ||
                user.permissions?.includes('finance_view_all') ||
                user.permissions?.includes('FINANCE_VIEW_DEPT') ||
                user.permissions?.includes('finance_view_dept');
            if (!hasView) {
                throw new common_1.ForbiddenException('Kasa ve banka hesaplarını görüntüleme yetkiniz bulunmamaktadır.');
            }
        }
        return this.accService.findAll(query, user);
    }
    getStatus() { return this.accService.getStatus(); }
    findOne(id) { return this.accService.findOne(id); }
    create(dto, userId) { return this.accService.create(dto, userId); }
    update(id, dto, userId) {
        return this.accService.update(id, dto, userId);
    }
    remove(id) { return this.accService.softDelete(id); }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.RequirePermissions)('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('FINANCE_VIEW_DEPT', 'FINANCE_VIEW_ALL'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('FINANCE_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateAccountDto, String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('FINANCE_EDIT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.UpdateAccountDto, String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('FINANCE_DELETE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "remove", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map