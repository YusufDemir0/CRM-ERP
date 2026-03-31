import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Party } from '../../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CreateTransactionDto } from '../dto/finance.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class TransactionsService {
    private txRepo;
    private partyRepo;
    private dataSource;
    private sequenceGenerator;
    constructor(txRepo: Repository<Transaction>, partyRepo: Repository<Party>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService);
    findAll(query: PaginationDto & {
        partyId?: number;
        type?: string;
        status?: string;
    }): Promise<PaginatedResult<Transaction>>;
    findOne(id: number): Promise<Transaction>;
    create(dto: CreateTransactionDto, userId?: number): Promise<Transaction>;
}
