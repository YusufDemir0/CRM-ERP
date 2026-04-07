import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, AssignRoleDto, SetUserPermissionDto } from './dto/role.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAllRoles(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("../auth/entities/role.entity").Role>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
    }>;
    findOneRole(id: number): Promise<import("../auth/entities/role.entity").Role>;
    createRole(dto: CreateRoleDto, userId: number): Promise<import("../auth/entities/role.entity").Role>;
    updateRole(id: number, dto: UpdateRoleDto, userId: number): Promise<import("../auth/entities/role.entity").Role>;
    deleteRole(id: number): Promise<void>;
    findAllPermissions(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("../auth/entities/permission.entity").Permission>>;
    createPermission(dto: CreatePermissionDto, userId: number): Promise<import("../auth/entities/permission.entity").Permission>;
    assignRole(dto: AssignRoleDto): Promise<import("../auth/entities/user-role.entity").UserRole>;
    removeRole(dto: AssignRoleDto): Promise<void>;
    setUserPermission(dto: SetUserPermissionDto, userId: number): Promise<import("../auth/entities/user-permission.entity").UserPermission>;
    getUserPermissions(userId: number): Promise<import("../auth/entities/user-permission.entity").UserPermission[]>;
}
