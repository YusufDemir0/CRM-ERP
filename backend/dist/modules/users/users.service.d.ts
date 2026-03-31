import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class UsersService {
    private userRepo;
    constructor(userRepo: Repository<User>);
    findAll(query: PaginationDto): Promise<PaginatedResult<User>>;
    findOne(id: number): Promise<User>;
    create(dto: CreateUserDto, currentUserId?: number): Promise<User>;
    update(id: number, dto: UpdateUserDto, currentUserId?: number): Promise<User>;
    softDelete(id: number, currentUserId?: number): Promise<void>;
}
