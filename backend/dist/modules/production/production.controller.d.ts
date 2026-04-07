import { ProductionService } from './production.service';
import { CreateBomDto, UpdateBomDto, CreateProductionOrderDto, UpdateProductionOrderDto } from './dto/production.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ProductionController {
    private readonly prodService;
    constructor(prodService: ProductionService);
    findAllBoms(query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/bom.entity").Bom>>;
    findOneBom(id: number): Promise<import("./entities/bom.entity").Bom>;
    createBom(dto: CreateBomDto, userId: number): Promise<import("./entities/bom.entity").Bom>;
    updateBom(id: number, dto: UpdateBomDto, userId: number): Promise<import("./entities/bom.entity").Bom>;
    deleteBom(id: number): Promise<void>;
    findAllOrders(query: PaginationDto & {
        status?: string;
    }): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/production-order.entity").ProductionOrder>>;
    findOneOrder(id: number): Promise<import("./entities/production-order.entity").ProductionOrder>;
    createOrder(dto: CreateProductionOrderDto, userId: number): Promise<import("./entities/production-order.entity").ProductionOrder>;
    updateOrder(id: number, dto: UpdateProductionOrderDto, userId: number): Promise<import("./entities/production-order.entity").ProductionOrder>;
    deleteOrder(id: number): Promise<void>;
    getStatus(): Promise<{
        draft: number;
        planned: number;
        inProgress: number;
        completed: number;
        total: number;
    }>;
}
