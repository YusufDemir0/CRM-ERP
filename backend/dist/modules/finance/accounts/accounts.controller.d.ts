import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, AccountsQueryDto } from '../dto/finance.dto';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
export declare class AccountsController {
    private readonly accService;
    constructor(accService: AccountsService);
    findAll(query: AccountsQueryDto & {
        ignorePermissionRestrictions?: string;
    }, user: JwtPayload): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/commercial-account.entity").CommercialAccount>>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        totalBalance: string;
    }>;
    findOne(id: string): Promise<import("./entities/commercial-account.entity").CommercialAccount>;
    create(dto: CreateAccountDto, userId: string): Promise<import("./entities/commercial-account.entity").CommercialAccount>;
    update(id: string, dto: UpdateAccountDto, userId: string): Promise<import("./entities/commercial-account.entity").CommercialAccount>;
    remove(id: string): Promise<void>;
}
