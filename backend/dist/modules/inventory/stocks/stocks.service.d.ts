import { Repository, DataSource, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { LogsService } from '../../logs/logs.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
export declare class StocksService {
    private stockRepo;
    private movementRepo;
    private dataSource;
    private sequenceGenerator;
    private logsService;
    private transactionContext;
    constructor(stockRepo: Repository<Stock>, movementRepo: Repository<StockMovement>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService, logsService: LogsService, transactionContext: TransactionContextService);
    findAll(query: StocksQueryDto): Promise<PaginatedResult<Stock>>;
    private updateMovingAverageCost;
    private validateStock;
    getMovements(stockId: number, query: any): Promise<PaginatedResult<StockMovement>>;
    decreaseStock(itemId: number, departmentId: number, quantity: number | Decimal, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: number;
        description: string;
    }, userId?: number): Promise<void>;
    decreaseStockBulk(items: Array<{
        itemId: number;
        quantity: number | Decimal;
    }>, departmentId: number, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: number;
        description: string;
    }, userId?: number): Promise<void>;
    reserveStockBulk(items: Array<{
        itemId: number;
        quantity: number | Decimal;
    }>, departmentId: number, manager?: EntityManager, userId?: number): Promise<void>;
    unreserveStockBulk(items: Array<{
        itemId: number;
        quantity: number | Decimal;
    }>, departmentId: number, manager?: EntityManager, userId?: number): Promise<void>;
    finalizeShipmentBulk(items: Array<{
        itemId: number;
        quantity: number | Decimal;
    }>, departmentId: number, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: number;
        description: string;
    }, userId?: number): Promise<void>;
    increaseStock(itemId: number, departmentId: number, quantity: number | Decimal, inUnitCost?: number | Decimal, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: number;
        description: string;
    }, userId?: number): Promise<void>;
    adjustStock(dto: StockAdjustmentDto, userId?: number): Promise<StockMovement>;
    transferStock(dto: TransferStockDto, userId?: number): Promise<{
        success: boolean;
        message: string;
    }>;
    revertStockMovementsByReference(referenceType: StockMovement['referenceType'], referenceId: number, manager?: EntityManager, userId?: number): Promise<void>;
    getCriticalStocks(): Promise<Stock[]>;
    getStatus(): Promise<{
        totalItems: number;
        totalQuantity: number;
        criticalCount: number;
    }>;
}
