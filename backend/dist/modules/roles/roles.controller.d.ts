import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, AssignRoleDto } from './dto/role.dto';
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
    createRole(dto: CreateRoleDto, userId: string): Promise<import("../auth/entities/role.entity").Role>;
    updateRole(id: string, dto: UpdateRoleDto, userId: string): Promise<import("../auth/entities/role.entity").Role>;
    findAllPermissions(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("../auth/entities/permission.entity").Permission>>;
    createPermission(dto: CreatePermissionDto, userId: string): Promise<import("../auth/entities/permission.entity").Permission>;
    assignRole(dto: AssignRoleDto): Promise<import("../auth/entities/user-role.entity").UserRole>;
    removeRole(dto: AssignRoleDto): Promise<void>;
    findOneRole(id: string): Promise<import("../auth/entities/role.entity").Role>;
    deleteRole(id: string): Promise<void>;
}
