import { Repository, DataSource } from 'typeorm';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { CreateBomDto, UpdateBomDto, CreateProductionOrderDto, UpdateProductionOrderDto } from './dto/production.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Item } from '../inventory/items/entities/item.entity';
export declare class ProductionService {
    private bomRepo;
    private bomItemRepo;
    private poRepo;
    private itemRepo;
    private dataSource;
    private sequenceGenerator;
    constructor(bomRepo: Repository<Bom>, bomItemRepo: Repository<BomItem>, poRepo: Repository<ProductionOrder>, itemRepo: Repository<Item>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService);
    findAllBoms(query: PaginationDto): Promise<PaginatedResult<Bom>>;
    findOneBom(id: number): Promise<Bom>;
    createBom(dto: CreateBomDto, userId?: number): Promise<Bom>;
    updateBom(id: number, dto: UpdateBomDto, userId?: number): Promise<Bom>;
    deleteBom(id: number): Promise<void>;
    findAllOrders(query: PaginationDto & {
        status?: string;
    }): Promise<PaginatedResult<ProductionOrder>>;
    findOneOrder(id: number): Promise<ProductionOrder>;
    createOrder(dto: CreateProductionOrderDto, userId?: number): Promise<ProductionOrder>;
    updateOrder(id: number, dto: UpdateProductionOrderDto, userId?: number): Promise<ProductionOrder>;
    deleteOrder(id: number): Promise<void>;
    getStatus(): Promise<{
        draft: number;
        planned: number;
        inProgress: number;
        completed: number;
        total: number;
    }>;
}
