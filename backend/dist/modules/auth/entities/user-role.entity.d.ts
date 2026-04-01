import { User } from './user.entity';
import { Role } from './role.entity';
export declare class UserRole {
    userId: number;
    roleId: number;
    state: number;
    createdBy: number | null;
    createdAt: Date;
    user: User;
    role: Role;
}
