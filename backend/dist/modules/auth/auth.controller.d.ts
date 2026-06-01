import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, res: Response, req: import('express').Request): Promise<{
        message: string;
        user: import("./interfaces/user-profile.interface").UserProfile;
    }>;
    refresh(req: import('express').Request, res: Response): Promise<{
        message: string;
    }>;
    logout(req: import('express').Request, res: Response): Promise<{
        message: string;
    }>;
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<import("./interfaces/user-profile.interface").UserProfile>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
