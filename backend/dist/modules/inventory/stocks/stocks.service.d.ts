import { EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginatedResult, PaginationDto } from '../../../common/dto/pagination.dto';
import { StocksReportsService } from './stocks-reports.service';
import { StocksTransactionsService } from './stocks-transactions.service';
export declare class StocksService {
    private readonly reportsService;
    private readonly transactionsService;
    private readonly logger;
    constructor(reportsService: StocksReportsService, transactionsService: StocksTransactionsService);
    findAll(query: StocksQueryDto): Promise<PaginatedResult<Stock>>;
    findAllMovements(query: PaginationDto & {
        type?: string;
        search?: string;
    }): Promise<PaginatedResult<StockMovement>>;
    getMovements(stockId: string, query: PaginationDto): Promise<PaginatedResult<StockMovement>>;
    getCriticalStocks(query?: PaginationDto): Promise<PaginatedResult<Stock> | Stock[]>;
    getStockReport(): Promise<any>;
    getStatus(): Promise<{
        totalItems: number;
        totalQuantity: string;
        criticalCount: number;
    }>;
    decreaseStock(itemId: string, departmentId: string, quantity: number | Decimal, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    decreaseStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal;
    }>, departmentId: string, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    reserveStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal;
    }>, departmentId: string, manager?: EntityManager, referenceInfo?: {
        type: StockMovement['referenceType'];
        id: string;
        description: string;
    }, userId?: string): Promise<void>;
    unreserveStockBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal;
    }>, departmentId: string, manager?: EntityManager, userId?: string): Promise<void>;
    finalizeShipmentBulk(items: Array<{
        itemId: string;
        quantity: number | Decimal;
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
    revertStockMovementsByReference(referenceType: StockMovement['referenceType'], referenceId: string, manager?: EntityManager, userId?: string): Promise<void>;
}
