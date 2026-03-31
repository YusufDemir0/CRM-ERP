import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("../auth/entities/user.entity").User>>;
    findOne(id: number): Promise<import("../auth/entities/user.entity").User>;
    create(dto: CreateUserDto, userId: number): Promise<import("../auth/entities/user.entity").User>;
    update(id: number, dto: UpdateUserDto, userId: number): Promise<import("../auth/entities/user.entity").User>;
    remove(id: number, userId: number): Promise<void>;
}
