import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, SalesQueryDto, ShipSaleDto } from './dto/sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    findAllSaleTypes(): Promise<import("./entities/sale-type.entity").SaleType[]>;
    createSaleType(dto: CreateSaleTypeDto, userId: number): Promise<import("./entities/sale-type.entity").SaleType>;
    getStatus(): Promise<{
        monthlyRevenue: import("decimal.js").Decimal;
        monthlyOrders: import("decimal.js").Decimal;
        pendingOrders: import("decimal.js").Decimal;
    }>;
    findAll(query: SalesQueryDto, user: any): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/sale.entity").Sale>>;
    findOne(id: number): Promise<import("./entities/sale.entity").Sale>;
    create(dto: CreateSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    update(id: number, dto: UpdateSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    approve(id: number, dto: ApproveSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    cancel(id: number, userId: number): Promise<import("./entities/sale.entity").Sale>;
    ship(id: number, dto: ShipSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    remove(id: number): Promise<void>;
}
