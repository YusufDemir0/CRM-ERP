import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthService {
    private userRepo;
    private userRoleRepo;
    private rolePermRepo;
    private userPermRepo;
    private jwtService;
    constructor(userRepo: Repository<User>, userRoleRepo: Repository<UserRole>, rolePermRepo: Repository<RolePermission>, userPermRepo: Repository<UserPermission>, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            fullName: string;
            email: string;
            departmentId: number | null;
            roles: string[];
        };
    }>;
    register(dto: RegisterDto): Promise<{
        id: number;
        username: string;
        fullName: string;
        email: string;
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        username: string;
        fullName: string;
        email: string;
        phone: string | null;
        departmentId: number | null;
        department: import("../departments/entities/department.entity").Department;
        roles: {
            id: number;
            name: string;
        }[];
        permissions: string[];
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: number, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
