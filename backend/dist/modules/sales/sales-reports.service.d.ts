import { StreamableFile } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Sale } from './entities/sale.entity';
import { SaleType } from './entities/sale-type.entity';
import { SalesQueryDto } from './dto/sale.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ItemData } from './domain/sale-calculator';
export declare class SalesReportsService {
    private saleRepo;
    private saleTypeRepo;
    constructor(saleRepo: Repository<Sale>, saleTypeRepo: Repository<SaleType>);
    findAllSaleTypes(): Promise<SaleType[]>;
    findMinimalLookup(user?: JwtPayload): Promise<any[]>;
    findAll(query: SalesQueryDto, user?: JwtPayload): Promise<PaginatedResult<Sale>>;
    findOne(id: string, manager?: EntityManager): Promise<Sale>;
    getStatus(): Promise<{
        monthlyRevenue: Decimal;
        monthlyOrders: Decimal;
        pendingOrders: Decimal;
    }>;
    exportToExcel(query: SalesQueryDto, user: JwtPayload): Promise<StreamableFile>;
    fetchItemData(manager: EntityManager, itemIds: string[]): Promise<Map<string, ItemData>>;
    getPeriodSummary(query: {
        year: number | string;
        month?: number | string;
        departmentId?: string;
    }, user: JwtPayload): Promise<any>;
}
