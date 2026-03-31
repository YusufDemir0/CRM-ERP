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
    findOneRole(id: number): Promise<Role>;
    createRole(dto: CreateRoleDto, currentUserId?: number): Promise<Role>;
    updateRole(id: number, dto: UpdateRoleDto, currentUserId?: number): Promise<Role>;
    deleteRole(id: number): Promise<void>;
    findAllPermissions(query: PaginationDto): Promise<PaginatedResult<Permission>>;
    createPermission(dto: CreatePermissionDto, currentUserId?: number): Promise<Permission>;
    assignRole(dto: AssignRoleDto): Promise<UserRole>;
    removeRole(dto: AssignRoleDto): Promise<void>;
    setUserPermission(dto: SetUserPermissionDto, currentUserId?: number): Promise<UserPermission>;
    getUserPermissions(userId: number): Promise<UserPermission[]>;
}
