import { ProductionService } from './production.service';
import { CreateBomDto, UpdateBomDto, CreateProductionOrderDto, UpdateProductionOrderDto, BomQueryDto, ProductionOrderQueryDto } from './dto/production.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class ProductionController {
    private readonly prodService;
    constructor(prodService: ProductionService);
    findAllBoms(query: BomQueryDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/bom.entity").Bom>>;
    findOneBom(id: string): Promise<import("./entities/bom.entity").Bom>;
    createBom(dto: CreateBomDto, userId: string): Promise<import("./entities/bom.entity").Bom>;
    updateBom(id: string, dto: UpdateBomDto, userId: string): Promise<import("./entities/bom.entity").Bom>;
    deleteBom(id: string): Promise<void>;
    findAllOrders(query: ProductionOrderQueryDto, user: JwtPayload): Promise<import("../../common/dto/pagination.dto").PaginatedResult<import("./entities/production-order.entity").ProductionOrder>>;
    findOneOrder(id: string, user: JwtPayload): Promise<import("./entities/production-order.entity").ProductionOrder>;
    createOrder(dto: CreateProductionOrderDto, userId: string): Promise<import("./entities/production-order.entity").ProductionOrder>;
    updateOrder(id: string, dto: UpdateProductionOrderDto, userId: string): Promise<import("./entities/production-order.entity").ProductionOrder>;
    deleteOrder(id: string): Promise<void>;
    getStatus(): Promise<{
        draft: number;
        planned: number;
        in_progress: number;
        completed: number;
        total: number;
    }>;
}
