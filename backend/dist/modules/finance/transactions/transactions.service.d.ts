import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class TransactionsService {
    private txRepo;
    private dataSource;
    private sequenceGenerator;
    constructor(txRepo: Repository<Transaction>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService);
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
        monthlyIncome: any;
        monthlyExpense: any;
        count: number;
        totalVolume: string;
    }>;
    getDailyTrends(): Promise<any[]>;
}
