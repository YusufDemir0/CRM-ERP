import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
export declare class TransactionsService {
    private txRepo;
    private dataSource;
    private sequenceGenerator;
    private transactionContext;
    constructor(txRepo: Repository<Transaction>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, transactionContext: TransactionContextService);
    findAll(query: PaginationDto & {
        partyId?: number;
        type?: string;
        status?: string;
    }): Promise<PaginatedResult<Transaction>>;
    findOne(id: number): Promise<Transaction>;
    create(dto: CreateTransactionDto, userId?: number): Promise<Transaction>;
    cancel(id: number, userId?: number): Promise<{
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
