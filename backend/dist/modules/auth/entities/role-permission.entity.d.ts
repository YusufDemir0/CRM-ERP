import { Role } from './role.entity';
import { Permission } from './permission.entity';
export declare class RolePermission {
    roleId: number;
    permissionId: number;
    role: Role;
    permission: Permission;
}
