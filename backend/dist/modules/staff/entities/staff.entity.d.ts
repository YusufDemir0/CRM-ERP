import { Department } from '../../departments/entities/department.entity';
import { User } from '../../auth/entities/user.entity';
export declare class Staff {
    id: string;
    state: number;
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    deletedAt: Date;
    firstName: string;
    lastName: string;
    phone: string;
    entryDate: string;
    lastDeactivationDate: string | null;
    tckn: string | null;
    departmentId: string;
    isActive: boolean;
    unit: string | null;
    department: Department;
    creator: User;
    updator: User;
}
