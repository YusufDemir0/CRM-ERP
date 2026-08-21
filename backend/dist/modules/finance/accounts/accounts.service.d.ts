import { Repository, DataSource } from 'typeorm';
import { CommercialAccount } from './entities/commercial-account.entity';
import { CreateAccountDto, UpdateAccountDto, AccountsQueryDto } from '../dto/finance.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { CurrenciesService } from '../currencies/currencies.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
export declare class AccountsService {
    private accRepo;
    private dataSource;
    private currenciesService;
    constructor(accRepo: Repository<CommercialAccount>, dataSource: DataSource, currenciesService: CurrenciesService);
    findAll(query: AccountsQueryDto & {
        ignorePermissionRestrictions?: string | boolean;
    }, currentUser?: JwtPayload): Promise<PaginatedResult<CommercialAccount>>;
    findOne(id: string): Promise<CommercialAccount>;
    create(dto: CreateAccountDto, userId: string): Promise<CommercialAccount>;
    update(id: string, dto: UpdateAccountDto, userId: string): Promise<CommercialAccount>;
    softDelete(id: string): Promise<void>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        totalBalance: string;
    }>;
}
