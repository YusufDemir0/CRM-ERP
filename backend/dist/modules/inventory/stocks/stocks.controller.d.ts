import { StocksService } from './stocks.service';
import { StockAdjustmentDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class StocksController {
    private readonly stocksService;
    constructor(stocksService: StocksService);
    findAll(query: PaginationDto & {
        departmentId?: number;
        itemId?: number;
    }): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock.entity").Stock>>;
    getCriticalStocks(): Promise<import("./entities/stock.entity").Stock[]>;
    getMovements(id: number, query: PaginationDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/stock-movement.entity").StockMovement>>;
    adjustStock(dto: StockAdjustmentDto, userId: number): Promise<import("./entities/stock-movement.entity").StockMovement>;
}
