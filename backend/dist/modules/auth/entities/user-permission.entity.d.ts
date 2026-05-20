import { User } from './user.entity';
import { Permission } from './permission.entity';
export declare class UserPermission {
    userId: string;
    permissionId: string;
    scopeType: 'global' | 'department' | 'own';
    effect: 'allow' | 'deny';
    scopeId: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedBy: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    user: User;
    permission: Permission;
}
