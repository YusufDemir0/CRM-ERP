import { Role } from './role.entity';
import { Permission } from './permission.entity';
export declare class RolePermission {
    roleId: number;
    permissionId: number;
    state: number;
    createdBy: number | null;
    createdAt: Date;
    role: Role;
    permission: Permission;
}
