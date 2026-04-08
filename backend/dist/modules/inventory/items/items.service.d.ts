import { Repository, DataSource } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class ItemsService {
    private itemRepo;
    private itemTypeRepo;
    private qtyTypeRepo;
    private codeGroupRepo;
    private dataSource;
    private sequenceGenerator;
    constructor(itemRepo: Repository<Item>, itemTypeRepo: Repository<ItemType>, qtyTypeRepo: Repository<QuantityType>, codeGroupRepo: Repository<ItemCodeGroup>, dataSource: DataSource, sequenceGenerator: SequenceGeneratorService);
    findAll(query: PaginationDto & {
        itemTypeId?: number;
    }): Promise<PaginatedResult<Item>>;
    findOne(id: number): Promise<Item>;
    create(dto: CreateItemDto, userId?: number): Promise<Item>;
    update(id: number, dto: UpdateItemDto, userId?: number): Promise<Item>;
    softDelete(id: number): Promise<void>;
    findAllItemTypes(): Promise<ItemType[]>;
    createItemType(dto: CreateItemTypeDto, userId?: number): Promise<ItemType>;
    updateItemType(id: number, dto: Partial<ItemType>, userId?: number): Promise<ItemType>;
    softDeleteItemType(id: number): Promise<void>;
    findAllItemCodeGroups(): Promise<ItemCodeGroup[]>;
    createItemCodeGroup(dto: CreateItemCodeGroupDto, userId?: number): Promise<ItemCodeGroup>;
    updateItemCodeGroup(id: number, dto: Partial<ItemCodeGroup>, userId?: number): Promise<ItemCodeGroup>;
    softDeleteItemCodeGroup(id: number): Promise<void>;
    findAllQuantityTypes(): Promise<QuantityType[]>;
    createQuantityType(dto: CreateQuantityTypeDto, userId?: number): Promise<QuantityType>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        lowStock: number;
    }>;
}
