import { Repository } from 'typeorm';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { UserPermission } from '../auth/entities/user-permission.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, AssignRoleDto, SetUserPermissionDto } from './dto/role.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class RolesService {
    private roleRepo;
    private permRepo;
    private userRoleRepo;
    private userPermRepo;
    private rolePermRepo;
    constructor(roleRepo: Repository<Role>, permRepo: Repository<Permission>, userRoleRepo: Repository<UserRole>, userPermRepo: Repository<UserPermission>, rolePermRepo: Repository<RolePermission>);
    findAllRoles(query: PaginationDto): Promise<PaginatedResult<Role>>;
    findOneRole(id: string): Promise<Role>;
    createRole(dto: CreateRoleDto, currentUserId: string): Promise<Role>;
    updateRole(id: string, dto: UpdateRoleDto, currentUserId: string): Promise<Role>;
    deleteRole(id: string): Promise<void>;
    findAllPermissions(query: PaginationDto): Promise<PaginatedResult<Permission>>;
    createPermission(dto: CreatePermissionDto, currentUserId: string): Promise<Permission>;
    assignRole(dto: AssignRoleDto): Promise<UserRole>;
    removeRole(dto: AssignRoleDto): Promise<void>;
    setUserPermission(dto: SetUserPermissionDto, currentUserId: string): Promise<UserPermission>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    removeUserPermission(dto: {
        userId: string;
        permissionId: string;
    }): Promise<void>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
    }>;
    getMatrixPresets(): Promise<{
        viewOnly: string[];
        manager: string[];
        architect: string[];
    }>;
}
