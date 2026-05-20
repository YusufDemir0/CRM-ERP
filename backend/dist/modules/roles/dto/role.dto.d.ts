export declare class CreateRoleDto {
    name: string;
    permissionIds?: string[];
}
export declare class UpdateRoleDto {
    name?: string;
    permissionIds?: string[];
    state?: number;
}
export declare class CreatePermissionDto {
    key: string;
    name: string;
    module: string;
}
export declare class AssignRoleDto {
    userId: string;
    roleId: string;
}
export declare class SetUserPermissionDto {
    userId: string;
    permissionId: string;
    effect: 'allow' | 'deny';
    scopeType: 'global' | 'department' | 'own';
    scopeId?: string;
}
export declare class RemoveUserPermissionDto {
    userId: string;
    permissionId: string;
}
