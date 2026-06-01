import { RolesService } from './roles.service';
import { SetUserPermissionDto, RemoveUserPermissionDto } from './dto/role.dto';
export declare class UserPermissionsController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    setUserPermission(dto: SetUserPermissionDto, userId: string): Promise<import("../auth/entities/user-permission.entity").UserPermission>;
    getUserPermissions(userId: string): Promise<import("../auth/entities/user-permission.entity").UserPermission[]>;
    removeUserPermission(dto: RemoveUserPermissionDto): Promise<void>;
}
