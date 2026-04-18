import { ClsService } from 'nestjs-cls';
import { EntityManager, DataSource } from 'typeorm';
export declare class TransactionContextService {
    private readonly cls;
    private readonly dataSource;
    constructor(cls: ClsService, dataSource: DataSource);
    get manager(): EntityManager;
    getAvailableManager(): EntityManager | null;
    setManager(manager: EntityManager): void;
    clear(): void;
}
