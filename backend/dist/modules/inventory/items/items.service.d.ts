import { Repository, DataSource } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class ItemsService {
    private itemRepo;
    private itemTypeRepo;
    private qtyTypeRepo;
    private dataSource;
    private sequenceGenerator;
    constructor(itemRepo: Repository<Item>, itemTypeRepo: Repository<ItemType>, qtyTypeRepo: Repository<QuantityType>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService);
    findAll(query: PaginationDto & {
        itemTypeId?: number;
    }): Promise<PaginatedResult<Item>>;
    findOne(id: number): Promise<Item>;
    create(dto: CreateItemDto, userId?: number): Promise<Item>;
    update(id: number, dto: UpdateItemDto, userId?: number): Promise<Item>;
    softDelete(id: number): Promise<void>;
    findAllItemTypes(): Promise<ItemType[]>;
    createItemType(dto: CreateItemTypeDto, userId?: number): Promise<ItemType>;
    findAllQuantityTypes(): Promise<QuantityType[]>;
    createQuantityType(dto: CreateQuantityTypeDto, userId?: number): Promise<QuantityType>;
}
