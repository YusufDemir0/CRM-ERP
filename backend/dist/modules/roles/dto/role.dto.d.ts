export declare class CreateRoleDto {
    name: string;
    permissionIds?: number[];
}
export declare class UpdateRoleDto {
    name?: string;
    permissionIds?: number[];
    state?: number;
}
export declare class CreatePermissionDto {
    key: string;
    name: string;
    module: string;
}
export declare class AssignRoleDto {
    userId: number;
    roleId: number;
}
export declare class SetUserPermissionDto {
    userId: number;
    permissionId: number;
    effect: 'allow' | 'deny';
    scopeType: 'global' | 'department' | 'own';
    scopeId?: number;
}
