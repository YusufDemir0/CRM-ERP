import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { UserPermission } from '../../modules/auth/entities/user-permission.entity';
import { RolePermission } from '../../modules/auth/entities/role-permission.entity';
import { UserRole } from '../../modules/auth/entities/user-role.entity';
import { Permission } from '../../modules/auth/entities/permission.entity';
import { Cache } from 'cache-manager';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private cacheManager;
    private userRoleRepo;
    private rolePermRepo;
    private userPermRepo;
    private permissionRepo;
    private readonly logger;
    constructor(reflector: Reflector, cacheManager: Cache, userRoleRepo: Repository<UserRole>, rolePermRepo: Repository<RolePermission>, userPermRepo: Repository<UserPermission>, permissionRepo: Repository<Permission>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
