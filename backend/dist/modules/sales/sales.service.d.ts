import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto } from './dto/sale.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class SalesService {
    private saleRepo;
    private saleItemRepo;
    private saleTypeRepo;
    private dataSource;
    private sequenceGenerator;
    private readonly logger;
    constructor(saleRepo: Repository<Sale>, saleItemRepo: Repository<SaleItem>, saleTypeRepo: Repository<SaleType>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService);
    findAllSaleTypes(): Promise<SaleType[]>;
    createSaleType(dto: CreateSaleTypeDto, userId?: number): Promise<SaleType>;
    findAll(query: PaginationDto & {
        status?: string;
        partyId?: number;
    }): Promise<PaginatedResult<Sale>>;
    findOne(id: number): Promise<Sale>;
    create(dto: CreateSaleDto, userId?: number): Promise<Sale>;
    update(id: number, dto: UpdateSaleDto, userId?: number): Promise<Sale>;
    approveSale(saleId: number, dto: ApproveSaleDto, userId?: number): Promise<Sale>;
    cancelSale(saleId: number, userId?: number): Promise<Sale>;
    softDelete(id: number): Promise<void>;
}
