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
var PermissionsGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const user_permission_entity_1 = require("../../modules/auth/entities/user-permission.entity");
const role_permission_entity_1 = require("../../modules/auth/entities/role-permission.entity");
const user_role_entity_1 = require("../../modules/auth/entities/user-role.entity");
const permission_entity_1 = require("../../modules/auth/entities/permission.entity");
let PermissionsGuard = PermissionsGuard_1 = class PermissionsGuard {
    constructor(reflector, userRoleRepo, rolePermRepo, userPermRepo, permissionRepo) {
        this.reflector = reflector;
        this.userRoleRepo = userRoleRepo;
        this.rolePermRepo = rolePermRepo;
        this.userPermRepo = userPermRepo;
        this.permissionRepo = permissionRepo;
        this.logger = new common_1.Logger(PermissionsGuard_1.name);
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.sub) {
            throw new common_1.ForbiddenException('Yetkilendirme bilgisi bulunamadı');
        }
        const userId = user.sub;
        const totalPermissions = await this.permissionRepo.count();
        if (totalPermissions === 0) {
            this.logger.warn(`No permissions defined in DB — bypassing guard for user ${userId}`);
            return true;
        }
        const userRoles = await this.userRoleRepo.find({
            where: { userId },
            relations: ['role'],
        });
        const roleIds = userRoles.map((ur) => ur.roleId);
        const roleNames = userRoles.map((ur) => ur.role?.name?.toLowerCase()).filter(Boolean);
        if (roleNames.includes('admin') || roleNames.includes('superadmin')) {
            return true;
        }
        let rolePermissionKeys = [];
        if (roleIds.length > 0) {
            const rolePerms = await this.rolePermRepo.find({
                where: { roleId: (0, typeorm_2.In)(roleIds) },
                relations: ['permission'],
            });
            rolePermissionKeys = rolePerms
                .filter((rp) => rp.permission)
                .map((rp) => rp.permission.key);
        }
        const userPerms = await this.userPermRepo.find({
            where: { userId },
            relations: ['permission'],
        });
        for (const requiredKey of requiredPermissions) {
            const denyOverride = userPerms.find((up) => up.permission?.key === requiredKey && up.effect === 'deny');
            if (denyOverride) {
                this.logger.warn(`User ${userId} denied permission: ${requiredKey} (explicit deny)`);
                throw new common_1.ForbiddenException(`Bu işlem için yetkiniz bulunmamaktadır: ${requiredKey}`);
            }
            const allowOverride = userPerms.find((up) => up.permission?.key === requiredKey && up.effect === 'allow');
            if (allowOverride) {
                request.permissionScope = {
                    type: allowOverride.scopeType,
                    scopeId: allowOverride.scopeId,
                };
                continue;
            }
            if (!rolePermissionKeys.includes(requiredKey)) {
                this.logger.warn(`User ${userId} missing permission: ${requiredKey}`);
                throw new common_1.ForbiddenException(`Bu işlem için yetkiniz bulunmamaktadır: ${requiredKey}`);
            }
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = PermissionsGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(user_permission_entity_1.UserPermission)),
    __param(4, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map