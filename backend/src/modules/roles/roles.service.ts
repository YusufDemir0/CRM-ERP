import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { UserPermission } from '../auth/entities/user-permission.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';
import {
  CreateRoleDto, UpdateRoleDto, CreatePermissionDto,
  AssignRoleDto, SetUserPermissionDto,
} from './dto/role.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(UserPermission) private userPermRepo: Repository<UserPermission>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
  ) {}

  // ────── ROLES ──────

  async findAllRoles(query: PaginationDto): Promise<PaginatedResult<Role>> {
    const qb = this.roleRepo.createQueryBuilder('role');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.leftJoin('role.permissions', 'permissions');
      qb.where('(role.name LIKE :s OR permissions.name LIKE :s)', { s });
    }

    qb.orderBy('role.createdAt', query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [idRows, total] = await qb.select('role.id').getManyAndCount();
    const ids = idRows.map(r => r.id);

    let data: Role[] = [];
    if (ids.length > 0) {
      data = await this.roleRepo.find({
        where: { id: In(ids) },
        relations: ['permissions'],
        order: { createdAt: query.sortOrder || 'DESC' },
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


  async findOneRole(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) throw new NotFoundException('Rol bulunamadı');
    return role;
  }

  async createRole(dto: CreateRoleDto, currentUserId?: number): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Bu isimde bir rol zaten mevcut');

    const role = this.roleRepo.create({ name: dto.name, createdBy: currentUserId });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      role.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    }

    return this.roleRepo.save(role);
  }

  async updateRole(id: number, dto: UpdateRoleDto, currentUserId?: number): Promise<Role> {
    const role = await this.findOneRole(id);
    if (dto.name) role.name = dto.name;
    
    if (dto.state === 0 && role.state !== 0) {
      const usersWithRole = await this.userRoleRepo.count({ where: { roleId: id } });
      if (usersWithRole > 0) {
        throw new BadRequestException(`Bu role atanmış ${usersWithRole} kullanıcı bulunmaktadır. Önce kullanıcıların rollerini değiştirin.`);
      }
    }
    if (dto.state !== undefined) role.state = dto.state;
    
    role.updatedBy = currentUserId || null;

    if (dto.permissionIds !== undefined) {
      if (dto.permissionIds.length > 0) {
        role.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepo.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    await this.findOneRole(id);
    await this.roleRepo.softDelete(id);
  }

  // ────── PERMISSIONS ──────

  async findAllPermissions(query: PaginationDto): Promise<PaginatedResult<Permission>> {
    const qb = this.permRepo.createQueryBuilder('perm');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
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

  async createPermission(dto: CreatePermissionDto, currentUserId?: number): Promise<Permission> {
    const existing = await this.permRepo.findOne({ where: { key: dto.key } });
    if (existing) throw new ConflictException('Bu key değerine sahip yetki zaten mevcut');

    const perm = this.permRepo.create({ ...dto, createdBy: currentUserId });
    return this.permRepo.save(perm);
  }

  // ────── USER ROLE ASSIGNMENT ──────

  async assignRole(dto: AssignRoleDto): Promise<UserRole> {
    const existing = await this.userRoleRepo.findOne({
      where: { userId: dto.userId, roleId: dto.roleId },
    });
    if (existing) throw new ConflictException('Bu rol zaten atanmış');

    const ur = this.userRoleRepo.create(dto);
    return this.userRoleRepo.save(ur);
  }

  async removeRole(dto: AssignRoleDto): Promise<void> {
    await this.userRoleRepo.delete({ userId: dto.userId, roleId: dto.roleId });
  }

  // ────── USER PERMISSION OVERRIDE ──────

  async setUserPermission(dto: SetUserPermissionDto, currentUserId?: number): Promise<UserPermission> {
    let up = await this.userPermRepo.findOne({
      where: { userId: dto.userId, permissionId: dto.permissionId, scopeType: dto.scopeType },
    });

    if (up) {
      up.effect = dto.effect;
      up.scopeId = dto.scopeId || null;
      up.updatedBy = currentUserId || null;
    } else {
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

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    return this.userPermRepo.find({
      where: { userId },
      relations: ['permission'],
    });
  }

  // ────── V2 REFINEMENTS ──────

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
      architect: ['*'] // Full access
    };
  }
}
