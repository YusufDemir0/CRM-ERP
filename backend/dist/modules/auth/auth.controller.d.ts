import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getCsrf(): Promise<{
        success: boolean;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        message: string;
        user: {
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
        };
    }>;
    logout(res: Response): Promise<{
        message: string;
    }>;
    register(dto: RegisterDto): Promise<{
        message: string;
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
