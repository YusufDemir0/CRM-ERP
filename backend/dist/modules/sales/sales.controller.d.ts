import { Response } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, SalesQueryDto, ShipSaleDto } from './dto/sale.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    findAllSaleTypes(): Promise<import("./entities/sale-type.entity").SaleType[]>;
    createSaleType(dto: CreateSaleTypeDto, userId: string): Promise<import("./entities/sale-type.entity").SaleType>;
    getStatus(): Promise<{
        monthlyRevenue: import("decimal.js").Decimal;
        monthlyOrders: import("decimal.js").Decimal;
        pendingOrders: import("decimal.js").Decimal;
    }>;
    export(query: SalesQueryDto, user: JwtPayload, res: Response): Promise<void>;
    findAll(query: SalesQueryDto, user: JwtPayload): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/sale.entity").Sale>>;
    findOne(id: string): Promise<import("./entities/sale.entity").Sale>;
    create(dto: CreateSaleDto, userId: string): Promise<import("./entities/sale.entity").Sale>;
    update(id: string, dto: UpdateSaleDto, userId: string): Promise<import("./entities/sale.entity").Sale>;
    approve(id: string, dto: ApproveSaleDto, userId: string): Promise<import("./entities/sale.entity").Sale>;
    cancel(id: string, userId: string): Promise<import("./entities/sale.entity").Sale>;
    ship(id: string, dto: ShipSaleDto, userId: string): Promise<import("./entities/sale.entity").Sale>;
    remove(id: string): Promise<void>;
}
