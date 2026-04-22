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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../auth/entities/role.entity");
const permission_entity_1 = require("../auth/entities/permission.entity");
const user_role_entity_1 = require("../auth/entities/user-role.entity");
const user_permission_entity_1 = require("../auth/entities/user-permission.entity");
const role_permission_entity_1 = require("../auth/entities/role-permission.entity");
const sql_helper_1 = require("../../common/utils/sql.helper");
let RolesService = class RolesService {
    constructor(roleRepo, permRepo, userRoleRepo, userPermRepo, rolePermRepo) {
        this.roleRepo = roleRepo;
        this.permRepo = permRepo;
        this.userRoleRepo = userRoleRepo;
        this.userPermRepo = userPermRepo;
        this.rolePermRepo = rolePermRepo;
    }
    async findAllRoles(query) {
        const qb = this.roleRepo.createQueryBuilder('role');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.leftJoin('role.permissions', 'permissions');
            qb.where('(role.name LIKE :s OR permissions.name LIKE :s)', { s });
        }
        if (query.state !== undefined) {
            qb.andWhere('role.state = :state', { state: query.state });
        }
        const allowedSortCols = ['name', 'createdAt', 'state'];
        const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
        qb.orderBy(`role.${sortCol}`, query.sortOrder || 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [idRows, total] = await qb.select('role.id').getManyAndCount();
        const ids = idRows.map(r => r.id);
        let data = [];
        if (ids.length > 0) {
            data = await this.roleRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
                relations: ['permissions'],
                order: { [sortCol]: query.sortOrder || 'DESC' },
            });
        }
        return {
            data,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20)),
            },
        };
    }
    async findOneRole(id) {
        const role = await this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
        if (!role)
            throw new common_1.NotFoundException('Rol bulunamadı');
        return role;
    }
    async createRole(dto, currentUserId) {
        const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException('Bu isimde bir rol zaten mevcut');
        const role = this.roleRepo.create({ name: dto.name, createdBy: currentUserId });
        if (dto.permissionIds && dto.permissionIds.length > 0) {
            role.permissions = await this.permRepo.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) });
        }
        return this.roleRepo.save(role);
    }
    async updateRole(id, dto, currentUserId) {
        const role = await this.findOneRole(id);
        if (dto.name)
            role.name = dto.name;
        if (dto.state === 0 && role.state !== 0) {
            const usersWithRole = await this.userRoleRepo.count({ where: { roleId: id } });
            if (usersWithRole > 0) {
                throw new common_1.BadRequestException(`Bu role atanmış ${usersWithRole} kullanıcı bulunmaktadır. Önce kullanıcıların rollerini değiştirin.`);
            }
        }
        if (dto.state !== undefined)
            role.state = dto.state;
        role.updatedBy = currentUserId || null;
        if (dto.permissionIds !== undefined) {
            if (dto.permissionIds.length > 0) {
                role.permissions = await this.permRepo.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) });
            }
            else {
                role.permissions = [];
            }
        }
        return this.roleRepo.save(role);
    }
    async deleteRole(id) {
        await this.findOneRole(id);
        await this.roleRepo.softDelete(id);
    }
    async findAllPermissions(query) {
        const qb = this.permRepo.createQueryBuilder('perm');
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            qb.where('(perm.name LIKE :s OR perm.key LIKE :s OR perm.module LIKE :s)', { s });
        }
        qb.orderBy('perm.module', 'ASC').addOrderBy('perm.name', 'ASC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async createPermission(dto, currentUserId) {
        const existing = await this.permRepo.findOne({ where: { key: dto.key } });
        if (existing)
            throw new common_1.ConflictException('Bu key değerine sahip yetki zaten mevcut');
        const perm = this.permRepo.create({ ...dto, createdBy: currentUserId });
        return this.permRepo.save(perm);
    }
    async assignRole(dto) {
        const existing = await this.userRoleRepo.findOne({
            where: { userId: dto.userId, roleId: dto.roleId },
        });
        if (existing)
            throw new common_1.ConflictException('Bu rol zaten atanmış');
        const ur = this.userRoleRepo.create(dto);
        return this.userRoleRepo.save(ur);
    }
    async removeRole(dto) {
        await this.userRoleRepo.delete({ userId: dto.userId, roleId: dto.roleId });
    }
    async setUserPermission(dto, currentUserId) {
        let up = await this.userPermRepo.findOne({
            where: { userId: dto.userId, permissionId: dto.permissionId, scopeType: dto.scopeType },
        });
        if (up) {
            up.effect = dto.effect;
            up.scopeId = dto.scopeId || null;
            up.updatedBy = currentUserId || null;
        }
        else {
            up = this.userPermRepo.create({
                userId: dto.userId,
                permissionId: dto.permissionId,
                effect: dto.effect,
                scopeType: dto.scopeType,
                scopeId: dto.scopeId || null,
                createdBy: currentUserId || null,
            });
        }
        return this.userPermRepo.save(up);
    }
    async getUserPermissions(userId) {
        return this.userPermRepo.find({
            where: { userId },
            relations: ['permission'],
        });
    }
    async removeUserPermission(dto) {
        await this.userPermRepo.delete({ userId: dto.userId, permissionId: dto.permissionId });
    }
    async getStatus() {
        const [active, passive] = await Promise.all([
            this.roleRepo.count({ where: { state: 1 } }),
            this.roleRepo.count({ where: { state: 0 } }),
        ]);
        return { active, passive, total: active + passive };
    }
    async getMatrixPresets() {
        return {
            viewOnly: ['dashboard.view', 'items.view', 'parties.view'],
            manager: ['dashboard.view', 'items.all', 'parties.all', 'reports.view'],
            architect: ['*']
        };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(3, (0, typeorm_1.InjectRepository)(user_permission_entity_1.UserPermission)),
    __param(4, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map