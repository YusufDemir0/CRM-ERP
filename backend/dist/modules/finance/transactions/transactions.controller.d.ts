import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from '../dto/finance.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class TransactionsController {
    private readonly txService;
    constructor(txService: TransactionsService);
    findAll(query: PaginationDto & {
        partyId?: number;
        type?: string;
        status?: string;
    }): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/transaction.entity").Transaction>>;
    findOne(id: number): Promise<import("./entities/transaction.entity").Transaction>;
    create(dto: CreateTransactionDto, userId: number): Promise<import("./entities/transaction.entity").Transaction>;
}
