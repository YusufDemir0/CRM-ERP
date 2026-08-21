import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto, TransactionsQueryDto, CreateTransferDto } from '../dto/finance.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
export declare class TransactionsService {
    private txRepo;
    private dataSource;
    private sequenceGenerator;
    private transactionContext;
    constructor(txRepo: Repository<Transaction>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, transactionContext: TransactionContextService);
    findAll(query: TransactionsQueryDto, currentUser?: JwtPayload): Promise<PaginatedResult<Transaction>>;
    findOne(id: string): Promise<Transaction>;
    create(dto: CreateTransactionDto, userId: string): Promise<Transaction>;
    cancel(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    transfer(dto: CreateTransferDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStatus(): Promise<{
        monthlyIncome: string;
        monthlyExpense: string;
        count: number;
        totalVolume: string;
    }>;
    getDailyTrends(): Promise<any[]>;
}
