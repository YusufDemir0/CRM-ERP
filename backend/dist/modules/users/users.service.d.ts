import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class UsersService {
    private userRepo;
    private roleRepo;
    private cacheManager;
    private transactionContext;
    constructor(userRepo: Repository<User>, roleRepo: Repository<Role>, cacheManager: Cache, transactionContext: TransactionContextService);
    findAll(query: PaginationDto, currentUser?: JwtPayload): Promise<PaginatedResult<User>>;
    findOne(id: string, currentUser?: JwtPayload): Promise<User>;
    create(dto: CreateUserDto, currentUserId: string): Promise<User>;
    update(id: string, dto: UpdateUserDto, currentUserId: string): Promise<User>;
    softDelete(id: string, currentUserId: string): Promise<void>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        adminCount: number;
    }>;
}
