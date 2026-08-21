import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, TransactionsQueryDto, CreateTransferDto } from '../dto/finance.dto';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
export declare class TransactionsController {
    private readonly txService;
    constructor(txService: TransactionsService);
    findAll(query: TransactionsQueryDto, user: JwtPayload): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/transaction.entity").Transaction>>;
    getStatus(): Promise<{
        monthlyIncome: string;
        monthlyExpense: string;
        count: number;
        totalVolume: string;
    }>;
    getDailyTrends(): Promise<any[]>;
    findOne(id: string): Promise<import("./entities/transaction.entity").Transaction>;
    create(dto: CreateTransactionDto, user: JwtPayload): Promise<import("./entities/transaction.entity").Transaction>;
    transfer(dto: CreateTransferDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    cancel(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
