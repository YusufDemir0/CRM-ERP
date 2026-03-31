import { Repository } from 'typeorm';
import { CommercialAccount } from './entities/commercial-account.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class AccountsService {
    private accRepo;
    constructor(accRepo: Repository<CommercialAccount>);
    findAll(query: PaginationDto): Promise<PaginatedResult<CommercialAccount>>;
    findOne(id: number): Promise<CommercialAccount>;
    create(dto: CreateAccountDto, userId?: number): Promise<CommercialAccount>;
    update(id: number, dto: UpdateAccountDto, userId?: number): Promise<CommercialAccount>;
    softDelete(id: number): Promise<void>;
}
