import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './interfaces/user-profile.interface';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthService implements OnModuleInit {
    private userRepo;
    private userRoleRepo;
    private rolePermRepo;
    private userPermRepo;
    private jwtService;
    private readonly logger;
    constructor(userRepo: Repository<User>, userRoleRepo: Repository<UserRole>, rolePermRepo: Repository<RolePermission>, userPermRepo: Repository<UserPermission>, jwtService: JwtService);
    onModuleInit(): void;
    login(dto: LoginDto, ipAddress?: string | null): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserProfile;
    }>;
    refreshToken(oldRefreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    register(dto: RegisterDto): Promise<{
        id: string;
        username: string;
        fullName: string;
        email: string;
    }>;
    getProfile(userId: string | string): Promise<UserProfile>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    decodeToken(token: string): any;
    logout(userId: string, username: string, fullName: string, ipAddress?: string | null): Promise<void>;
}
