import { StreamableFile } from '@nestjs/common';
import { Sale } from './entities/sale.entity';
import { SaleType } from './entities/sale-type.entity';
import { SalesReportsService } from './sales-reports.service';
import { SalesTransactionsService } from './sales-transactions.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, ShipSaleDto, SalesQueryDto } from './dto/sale.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class SalesService {
    private readonly reportsService;
    private readonly transactionsService;
    private readonly logger;
    constructor(reportsService: SalesReportsService, transactionsService: SalesTransactionsService);
    findAllSaleTypes(): Promise<SaleType[]>;
    findAll(query: SalesQueryDto, user?: JwtPayload): Promise<PaginatedResult<Sale>>;
    findMinimalLookup(user?: JwtPayload): Promise<any[]>;
    findOne(id: string): Promise<Sale>;
    getStatus(): Promise<{
        monthlyRevenue: import("decimal.js").Decimal;
        monthlyOrders: import("decimal.js").Decimal;
        pendingOrders: import("decimal.js").Decimal;
    }>;
    exportToExcel(query: SalesQueryDto, user: JwtPayload): Promise<StreamableFile>;
    getPeriodSummary(query: {
        year: number | string;
        month?: number | string;
        departmentId?: string;
    }, user: JwtPayload): Promise<any>;
    createSaleType(dto: CreateSaleTypeDto, userId: string): Promise<SaleType>;
    create(dto: CreateSaleDto, userId: string): Promise<Sale>;
    update(id: string, dto: UpdateSaleDto, userId: string, user?: JwtPayload): Promise<Sale>;
    approveSale(saleId: string, dto: ApproveSaleDto, userId: string, user?: JwtPayload): Promise<Sale>;
    cancelSale(saleId: string, reason: string, userId: string): Promise<Sale>;
    revertToDraft(saleId: string, userId: string): Promise<Sale>;
    shipSale(saleId: string, dto: ShipSaleDto, userId: string): Promise<Sale>;
    softDelete(id: string, userId: string, user?: JwtPayload): Promise<void>;
}
