import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    }>;
}
