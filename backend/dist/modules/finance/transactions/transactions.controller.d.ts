import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionsQueryDto } from '../dto/finance.dto';
export declare class TransactionsController {
    private readonly txService;
    constructor(txService: TransactionsService);
    findAll(query: TransactionsQueryDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/transaction.entity").Transaction>>;
    findOne(id: number): Promise<import("./entities/transaction.entity").Transaction>;
    create(dto: CreateTransactionDto, userId: number): Promise<import("./entities/transaction.entity").Transaction>;
}
