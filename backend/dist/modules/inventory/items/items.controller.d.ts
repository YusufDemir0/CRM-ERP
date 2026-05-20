import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ImportItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto, UpdateItemTypeDto, UpdateQuantityTypeDto, UpdateItemCodeGroupDto } from '../dto/inventory.dto';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
    importItems(items: ImportItemDto[], userId: string): Promise<{
        updatedCount: number;
        insertedCount: number;
        errors: string[];
    }>;
    exportItems(query: ItemsQueryDto): Promise<import("@nestjs/common").StreamableFile>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        lowStock: number;
    }>;
    findAllItemTypes(): Promise<import("./entities/item-type.entity").ItemType[]>;
    findAllQuantityTypes(): Promise<import("./entities/quantity-type.entity").QuantityType[]>;
    findAllCodeGroups(): Promise<import("./entities/item-code-group.entity").ItemCodeGroup[]>;
    findAll(query: ItemsQueryDto): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/item.entity").Item>>;
    findOne(id: string): Promise<import("./entities/item.entity").Item>;
    create(dto: CreateItemDto, userId: string): Promise<import("./entities/item.entity").Item>;
    createItemType(dto: CreateItemTypeDto, userId: string): Promise<import("./entities/item-type.entity").ItemType>;
    createCodeGroup(dto: CreateItemCodeGroupDto, userId: string): Promise<import("./entities/item-code-group.entity").ItemCodeGroup>;
    createQuantityType(dto: CreateQuantityTypeDto, userId: string): Promise<import("./entities/quantity-type.entity").QuantityType>;
    updateQuantityType(id: string, dto: UpdateQuantityTypeDto, userId: string): Promise<import("./entities/quantity-type.entity").QuantityType>;
    removeQuantityType(id: string): Promise<void>;
    updateItemType(id: string, dto: UpdateItemTypeDto, userId: string): Promise<import("./entities/item-type.entity").ItemType>;
    updateCodeGroup(id: string, dto: UpdateItemCodeGroupDto, userId: string): Promise<import("./entities/item-code-group.entity").ItemCodeGroup>;
    update(id: string, dto: UpdateItemDto, userId: string): Promise<import("./entities/item.entity").Item>;
    removeItemType(id: string): Promise<void>;
    removeCodeGroup(id: string): Promise<void>;
    remove(id: string, userId: string): Promise<void>;
}
