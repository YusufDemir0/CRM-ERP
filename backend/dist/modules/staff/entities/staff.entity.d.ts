import { Department } from '../../departments/entities/department.entity';
import { User } from '../../auth/entities/user.entity';
export declare class Staff {
    id: number;
    state: number;
    createdBy: number;
    createdAt: Date;
    updatedBy: number;
    updatedAt: Date;
    deletedAt: Date;
    firstName: string;
    lastName: string;
    phone: string;
    entryDate: string;
    lastDeactivationDate: string | null;
    tckn: string | null;
    departmentId: number;
    isActive: boolean;
    department: Department;
    creator: User;
    updator: User;
}
