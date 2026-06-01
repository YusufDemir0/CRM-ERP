import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StocksQueryDto } from '../dto/inventory.dto';
import { PaginatedResult, PaginationDto } from '../../../common/dto/pagination.dto';
export declare class StocksReportsService {
    private stockRepo;
    private movementRepo;
    private readonly logger;
    constructor(stockRepo: Repository<Stock>, movementRepo: Repository<StockMovement>);
    findAll(query: StocksQueryDto): Promise<PaginatedResult<Stock>>;
    findAllMovements(query: PaginationDto & {
        type?: string;
        search?: string;
    }): Promise<PaginatedResult<StockMovement>>;
    getMovements(stockId: string, query: PaginationDto): Promise<PaginatedResult<StockMovement>>;
    getCriticalStocks(query: PaginationDto): Promise<PaginatedResult<Stock>>;
    getStockReport(): Promise<any>;
    getStatus(): Promise<{
        totalItems: number;
        totalQuantity: string;
        criticalCount: number;
    }>;
}
