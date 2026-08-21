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
exports.UserPermissionsController = void 0;
const common_1 = require("@nestjs/common");
const roles_service_1 = require("./roles.service");
const role_dto_1 = require("./dto/role.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let UserPermissionsController = class UserPermissionsController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    setUserPermission(dto, userId) {
        return this.rolesService.setUserPermission(dto, userId);
    }
    getUserPermissions(userId) {
        return this.rolesService.getUserPermissions(userId);
    }
    removeUserPermission(dto) {
        return this.rolesService.removeUserPermission(dto);
    }
};
exports.UserPermissionsController = UserPermissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('USERS_OVERRIDE_PERM'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.SetUserPermissionDto, String]),
    __metadata("design:returntype", void 0)
], UserPermissionsController.prototype, "setUserPermission", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, permissions_decorator_1.RequirePermissions)('USERS_OVERRIDE_PERM'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserPermissionsController.prototype, "getUserPermissions", null);
__decorate([
    (0, common_1.Delete)(),
    (0, permissions_decorator_1.RequirePermissions)('USERS_OVERRIDE_PERM'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.RemoveUserPermissionDto]),
    __metadata("design:returntype", void 0)
], UserPermissionsController.prototype, "removeUserPermission", null);
exports.UserPermissionsController = UserPermissionsController = __decorate([
    (0, common_1.Controller)('user-permissions'),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], UserPermissionsController);
//# sourceMappingURL=user-permissions.controller.js.map