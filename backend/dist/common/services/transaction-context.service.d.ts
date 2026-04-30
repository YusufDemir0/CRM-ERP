import { TransactionHost } from '@nestjs-cls/transactional';
import { EntityManager, DataSource } from 'typeorm';
export declare class TransactionContextService {
    private readonly txHost;
    private readonly dataSource;
    constructor(txHost: TransactionHost<any>, dataSource: DataSource);
    get manager(): EntityManager;
    getAvailableManager(): EntityManager | null;
}
