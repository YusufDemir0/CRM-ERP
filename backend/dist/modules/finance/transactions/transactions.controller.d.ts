import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionsQueryDto } from '../dto/finance.dto';
export declare class TransactionsController {
    private readonly txService;
    constructor(txService: TransactionsService);
    findAll(query: TransactionsQueryDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/transaction.entity").Transaction>>;
    getStatus(): Promise<{
        monthlyIncome: string;
        monthlyExpense: string;
        count: number;
        totalVolume: string;
    }>;
    getDailyTrends(): Promise<any[]>;
    findOne(id: string): Promise<import("./entities/transaction.entity").Transaction>;
    create(dto: CreateTransactionDto, userId: string): Promise<import("./entities/transaction.entity").Transaction>;
    cancel(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
