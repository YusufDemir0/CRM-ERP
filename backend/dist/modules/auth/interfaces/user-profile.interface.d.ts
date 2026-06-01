import { Department } from '../../departments/entities/department.entity';
export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
    departmentId: string | null;
    department: Department | null;
    roles: {
        id: string;
        name: string;
    }[];
    permissions: string[];
}
