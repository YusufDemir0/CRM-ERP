import { Repository, DataSource } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockAdjustmentDto } from '../dto/inventory.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class StocksService {
    private stockRepo;
    private movementRepo;
    private dataSource;
    constructor(stockRepo: Repository<Stock>, movementRepo: Repository<StockMovement>, dataSource: DataSource);
    findAll(query: PaginationDto & {
        departmentId?: number;
        itemId?: number;
    }): Promise<PaginatedResult<Stock>>;
    getMovements(stockId: number, query: PaginationDto): Promise<PaginatedResult<StockMovement>>;
    adjustStock(dto: StockAdjustmentDto, userId?: number): Promise<StockMovement>;
    getCriticalStocks(): Promise<Stock[]>;
    getStatus(): Promise<{
        totalItems: number;
        totalQuantity: number;
        criticalCount: number;
    }>;
}
