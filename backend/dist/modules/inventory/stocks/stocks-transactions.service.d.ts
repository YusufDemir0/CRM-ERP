import { Repository, DataSource, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, TransferStockDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { LogsService } from '../../logs/logs.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
export declare class StocksTransactionsService {
    private stockRepo;
    private movementRepo;
    private dataSource;
    private sequenceGenerator;
    private logsService;
    private transactionContext;
    private readonly logger;
    constructor(stockRepo: Repository<Stock>, movementRepo: Repository<StockMovement>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, logsService: LogsService, transactionContext: TransactionContextService);
    private updateMovingAverageCost;
    syncItemTotalStock(itemIds: string[], manager: EntityManager): Promise<void>;
    decreaseStock(itemId: string, departmentId: string, quantity: number | Decimal, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    decreaseStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal | string;
    }>, departmentId: string, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    reserveStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal | string;
    }>, departmentId: string, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    unreserveStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal | string;
    }>, departmentId: string, manager?: EntityManager, userId?: string): Promise<void>;
    releaseStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal | string;
    }>, departmentId: string, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    finalizeShipmentBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal | string;
    }>, departmentId: string, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    increaseStock(itemId: string, departmentId: string, quantity: number | Decimal, inUnitCost?: number | Decimal, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    adjustStock(dto: StockAdjustmentDto, userId: string): Promise<StockMovement>;
    transferStock(dto: TransferStockDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    revertStockMovementsByReference(referenceType: StockMovement['referenceType'], referenceId: string, manager: EntityManager | undefined, userId: string): Promise<void>;
}
