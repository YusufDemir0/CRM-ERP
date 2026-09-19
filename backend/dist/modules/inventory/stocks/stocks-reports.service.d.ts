import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StocksQueryDto } from '../dto/inventory.dto';
import { PaginatedResult, PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
export declare class StocksReportsService {
    private stockRepo;
    private movementRepo;
    private readonly logger;
    constructor(stockRepo: Repository<Stock>, movementRepo: Repository<StockMovement>);
    private checkViewAll;
    findAll(query: StocksQueryDto, user?: JwtPayload): Promise<PaginatedResult<Stock>>;
    findAllMovements(query: PaginationDto & {
        type?: string;
        search?: string;
    }, user?: JwtPayload): Promise<PaginatedResult<StockMovement>>;
    getMovements(stockId: string, query: PaginationDto, user?: JwtPayload): Promise<PaginatedResult<StockMovement>>;
    getCriticalStocks(query: PaginationDto, user?: JwtPayload): Promise<PaginatedResult<Stock>>;
    getStockReport(): Promise<any>;
    getStatus(user?: JwtPayload): Promise<{
        totalItems: number;
        totalQuantity: string;
        criticalCount: number;
    }>;
    getDepartmentStockSummary(query: {
        departmentId?: string;
    }, user?: JwtPayload): Promise<any>;
}
