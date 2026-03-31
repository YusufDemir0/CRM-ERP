import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private userRepo;
    private jwtService;
    constructor(userRepo: Repository<User>, jwtService: JwtService);
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
