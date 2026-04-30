import { StocksService } from './stocks.service';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class StocksController {
    private readonly stocksService;
    constructor(stocksService: StocksService);
    findAll(query: StocksQueryDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock.entity").Stock>>;
    getCriticalStocks(): Promise<import("./entities/stock.entity").Stock[]>;
    getMovements(id: number, query: PaginationDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock-movement.entity").StockMovement>>;
    adjustStock(dto: StockAdjustmentDto, userId: number): Promise<import("./entities/stock-movement.entity").StockMovement>;
    transferStock(dto: TransferStockDto, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getStatus(): Promise<{
        totalItems: number;
        totalQuantity: string;
        criticalCount: number;
    }>;
}
