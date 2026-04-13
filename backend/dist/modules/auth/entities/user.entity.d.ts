import { BaseEntity } from '../../../common/entities/base.entity';
import { Department } from '../../departments/entities/department.entity';
import { Role } from './role.entity';
export declare class User extends BaseEntity {
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    phone: string | null;
    departmentId: number | null;
    department: Department;
    failedLoginAttempts: number;
    roles: Role[];
}
