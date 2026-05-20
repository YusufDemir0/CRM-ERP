import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("../auth/entities/user.entity").User>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        adminCount: number;
    }>;
    findOne(id: string): Promise<import("../auth/entities/user.entity").User>;
    create(dto: CreateUserDto, userId: string): Promise<import("../auth/entities/user.entity").User>;
    update(id: string, dto: UpdateUserDto, userId: string): Promise<import("../auth/entities/user.entity").User>;
    remove(id: string, userId: string): Promise<void>;
}
