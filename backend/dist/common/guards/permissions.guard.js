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
const user_entity_1 = require("../../modules/auth/entities/user.entity");
const record_state_enum_1 = require("../enums/record-state.enum");
const cache_manager_1 = require("@nestjs/cache-manager");
let PermissionsGuard = PermissionsGuard_1 = class PermissionsGuard {
    constructor(reflector, cacheManager, userRoleRepo, rolePermRepo, userPermRepo, permissionRepo, userRepo) {
        this.reflector = reflector;
        this.cacheManager = cacheManager;
        this.userRoleRepo = userRoleRepo;
        this.rolePermRepo = rolePermRepo;
        this.userPermRepo = userPermRepo;
        this.permissionRepo = permissionRepo;
        this.userRepo = userRepo;
        this.logger = new common_1.Logger(PermissionsGuard_1.name);
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.sub) {
            if (!requiredPermissions || requiredPermissions.length === 0) {
                return true;
            }
            throw new common_1.ForbiddenException('Yetkilendirme bilgisi bulunamadı');
        }
        const userId = user.sub;
        const stateCacheKey = `user_state_${userId}`;
        let userState;
        const cachedState = await this.cacheManager.get(stateCacheKey);
        if (cachedState) {
            userState = cachedState;
        }
        else {
            const dbUser = await this.userRepo.findOne({
                where: { id: String(userId) },
                select: ['id', 'state', 'tokenVersion'],
            });
            if (dbUser) {
                userState = { state: dbUser.state, tokenVersion: dbUser.tokenVersion };
                await this.cacheManager.set(stateCacheKey, userState, 60000);
            }
        }
        if (userState) {
            if (userState.state !== record_state_enum_1.RecordState.ACTIVE) {
                this.logger.warn(`Blocked request from inactive user ${userId} (state=${userState.state})`);
                throw new common_1.ForbiddenException('Hesabınız aktif değil. Lütfen yöneticinizle iletişime geçin.');
            }
            if (user.tokenVersion !== undefined && userState.tokenVersion !== user.tokenVersion) {
                this.logger.warn(`Blocked stale token for user ${userId} (jwt.tv=${user.tokenVersion}, db.tv=${userState.tokenVersion})`);
                throw new common_1.ForbiddenException('Oturumunuz geçersiz kılınmıştır. Lütfen tekrar giriş yapın.');
            }
        }
        const cacheKey = `user_perms_${userId}`;
        const cachedData = await this.cacheManager.get(cacheKey);
        let finalPermissions = [];
        let isSystemAdmin = false;
        if (cachedData) {
            finalPermissions = cachedData.permissions;
            isSystemAdmin = cachedData.isSystemAdmin;
        }
        else {
            const userRoles = await this.userRoleRepo.find({
                where: { userId },
                relations: ['role'],
            });
            const roleIds = userRoles.map((ur) => ur.roleId);
            isSystemAdmin = userRoles.some((ur) => ur.role?.isSystemAdmin === true);
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
            const userDenySet = new Set(userPerms.filter(up => up.effect === 'deny').map(up => up.permission?.key));
            const userAllowKeys = userPerms.filter(up => up.effect === 'allow').map(up => up.permission?.key);
            const allCandidateKeys = [...rolePermissionKeys, ...userAllowKeys];
            finalPermissions = Array.from(new Set(allCandidateKeys.filter(key => key && !userDenySet.has(key))));
            await this.cacheManager.set(cacheKey, { permissions: finalPermissions, isSystemAdmin }, 60000);
        }
        request.user.isSystemAdmin = isSystemAdmin;
        request.user.permissions = finalPermissions;
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        if (isSystemAdmin) {
            return true;
        }
        const hasAny = requiredPermissions.some(key => finalPermissions.includes(key));
        if (!hasAny) {
            this.logger.warn(`User ${userId} missing one of: ${requiredPermissions.join(', ')}`);
            throw new common_1.ForbiddenException(`Bu işlem için yetkiniz bulunmamaktadır.`);
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = PermissionsGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(3, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(4, (0, typeorm_1.InjectRepository)(user_permission_entity_1.UserPermission)),
    __param(5, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [core_1.Reflector, Object, typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map