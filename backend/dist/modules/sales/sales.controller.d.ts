import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto } from './dto/sale.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    findAllSaleTypes(): Promise<import("./entities/sale-type.entity").SaleType[]>;
    createSaleType(dto: CreateSaleTypeDto, userId: number): Promise<import("./entities/sale-type.entity").SaleType>;
    findAll(query: PaginationDto & {
        status?: string;
        partyId?: number;
    }): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/sale.entity").Sale>>;
    findOne(id: number): Promise<import("./entities/sale.entity").Sale>;
    create(dto: CreateSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    update(id: number, dto: UpdateSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    approve(id: number, dto: ApproveSaleDto, userId: number): Promise<import("./entities/sale.entity").Sale>;
    cancel(id: number, userId: number): Promise<import("./entities/sale.entity").Sale>;
    remove(id: number): Promise<void>;
}
