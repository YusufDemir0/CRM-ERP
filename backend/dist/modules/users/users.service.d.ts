import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class UsersService {
    private userRepo;
    private roleRepo;
    private cacheManager;
    constructor(userRepo: Repository<User>, roleRepo: Repository<Role>, cacheManager: Cache);
    findAll(query: PaginationDto): Promise<PaginatedResult<User>>;
    findOne(id: number): Promise<User>;
    create(dto: CreateUserDto, currentUserId?: number): Promise<User>;
    update(id: number, dto: UpdateUserDto, currentUserId?: number): Promise<User>;
    softDelete(id: number, currentUserId?: number): Promise<void>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        adminCount: number;
    }>;
}
