import { User } from './user.entity';
import { Permission } from './permission.entity';
export declare class UserPermission {
    userId: number;
    permissionId: number;
    scopeType: 'global' | 'department' | 'own';
    effect: 'allow' | 'deny';
    scopeId: number | null;
    createdBy: number | null;
    createdAt: Date;
    updatedBy: number | null;
    updatedAt: Date;
    deletedAt: Date | null;
    user: User;
    permission: Permission;
}
