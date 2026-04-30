import { BaseEntity } from '../../../common/entities/base.entity';
import { Department } from '../../departments/entities/department.entity';
import { Role } from './role.entity';
import { UserPermission } from './user-permission.entity';
export declare class User extends BaseEntity {
    username: string;
    passwordHash: string;
    refreshTokenHash: string | null;
    fullName: string;
    email: string;
    phone: string | null;
    departmentId: number | null;
    department: Department;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    entryDate: string | null;
    lastDeactivationDate: string | null;
    tokenVersion: number;
    roles: Role[];
    userPermissions: UserPermission[];
}
