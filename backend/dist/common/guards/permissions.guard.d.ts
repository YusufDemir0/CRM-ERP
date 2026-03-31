import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { UserPermission } from '../../modules/auth/entities/user-permission.entity';
import { RolePermission } from '../../modules/auth/entities/role-permission.entity';
import { UserRole } from '../../modules/auth/entities/user-role.entity';
import { Permission } from '../../modules/auth/entities/permission.entity';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private userRoleRepo;
    private rolePermRepo;
    private userPermRepo;
    private permissionRepo;
    private readonly logger;
    constructor(reflector: Reflector, userRoleRepo: Repository<UserRole>, rolePermRepo: Repository<RolePermission>, userPermRepo: Repository<UserPermission>, permissionRepo: Repository<Permission>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
