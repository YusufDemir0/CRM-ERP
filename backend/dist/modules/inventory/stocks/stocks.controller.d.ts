import { StocksService } from './stocks.service';
import { StockAdjustmentDto, StocksQueryDto, TransferStockDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
export declare class StocksController {
    private readonly stocksService;
    constructor(stocksService: StocksService);
    findAll(query: StocksQueryDto, user: JwtPayload): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock.entity").Stock>>;
    getCriticalStocks(user: JwtPayload): Promise<import("./entities/stock.entity").Stock[] | import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock.entity").Stock>>;
    findAllMovements(query: PaginationDto & {
        type?: string;
        search?: string;
    }, user: JwtPayload): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock-movement.entity").StockMovement>>;
    getMovements(id: string, query: PaginationDto, user: JwtPayload): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock-movement.entity").StockMovement>>;
    adjustStock(dto: StockAdjustmentDto, userId: string): Promise<import("./entities/stock-movement.entity").StockMovement>;
    transferStock(dto: TransferStockDto, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStatus(user: JwtPayload): Promise<{
        totalItems: number;
        totalQuantity: string;
        criticalCount: number;
    }>;
}
