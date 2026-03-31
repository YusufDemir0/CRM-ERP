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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_service_1 = require("./roles.service");
const role_dto_1 = require("./dto/role.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    findAllRoles(query) {
        return this.rolesService.findAllRoles(query);
    }
    findOneRole(id) {
        return this.rolesService.findOneRole(id);
    }
    createRole(dto, userId) {
        return this.rolesService.createRole(dto, userId);
    }
    updateRole(id, dto, userId) {
        return this.rolesService.updateRole(id, dto, userId);
    }
    deleteRole(id) {
        return this.rolesService.deleteRole(id);
    }
    findAllPermissions(query) {
        return this.rolesService.findAllPermissions(query);
    }
    createPermission(dto, userId) {
        return this.rolesService.createPermission(dto, userId);
    }
    assignRole(dto) {
        return this.rolesService.assignRole(dto);
    }
    removeRole(dto) {
        return this.rolesService.removeRole(dto);
    }
    setUserPermission(dto, userId) {
        return this.rolesService.setUserPermission(dto, userId);
    }
    getUserPermissions(userId) {
        return this.rolesService.getUserPermissions(userId);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('rol_goruntuleme'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('rol_goruntuleme'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOneRole", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('rol_olusturma'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.CreateRoleDto, Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('rol_duzenleme'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, role_dto_1.UpdateRoleDto, Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('rol_silme'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('permissions/all'),
    (0, permissions_decorator_1.RequirePermissions)('rol_goruntuleme'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, permissions_decorator_1.RequirePermissions)('rol_olusturma'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.CreatePermissionDto, Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, permissions_decorator_1.RequirePermissions)('rol_atama'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.AssignRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('assign'),
    (0, permissions_decorator_1.RequirePermissions)('rol_atama'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.AssignRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "removeRole", null);
__decorate([
    (0, common_1.Post)('user-permissions'),
    (0, permissions_decorator_1.RequirePermissions)('yetki_atama'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.SetUserPermissionDto, Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "setUserPermission", null);
__decorate([
    (0, common_1.Get)('user-permissions/:userId'),
    (0, permissions_decorator_1.RequirePermissions)('yetki_goruntuleme'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "getUserPermissions", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map