import { User } from './user.entity';
import { Role } from './role.entity';
export declare class UserRole {
    userId: string;
    roleId: string;
    user: User;
    role: Role;
}
