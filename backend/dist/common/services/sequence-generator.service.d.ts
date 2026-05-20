import { DataSource, EntityManager } from 'typeorm';
import { TransactionContextService } from './transaction-context.service';
export declare class SequenceGeneratorService {
    private readonly transactionContext;
    private readonly dataSource;
    private readonly logger;
    constructor(transactionContext: TransactionContextService, dataSource: DataSource);
    private getNextNumber;
    generateItemCode(manager: EntityManager | undefined, itemCodeGroupId: string): Promise<string>;
    generateSaleCode(manager: EntityManager | undefined, departmentId: string): Promise<string>;
    generateProductionCode(manager?: EntityManager, prefix?: string): Promise<string>;
    generateTransactionCode(manager: EntityManager | undefined, prefix: string): Promise<string>;
}
