import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto } from '../dto/inventory.dto';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
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
    findOne(id: number): Promise<import("./entities/item.entity").Item>;
    create(dto: CreateItemDto, userId: number): Promise<import("./entities/item.entity").Item>;
    createItemType(dto: CreateItemTypeDto, userId: number): Promise<import("./entities/item-type.entity").ItemType>;
    createCodeGroup(dto: CreateItemCodeGroupDto, userId: number): Promise<import("./entities/item-code-group.entity").ItemCodeGroup>;
    createQuantityType(dto: CreateQuantityTypeDto, userId: number): Promise<import("./entities/quantity-type.entity").QuantityType>;
    updateQuantityType(id: number, dto: any, userId: number): Promise<import("./entities/quantity-type.entity").QuantityType>;
    removeQuantityType(id: number): Promise<void>;
    updateItemType(id: number, dto: any, userId: number): Promise<import("./entities/item-type.entity").ItemType>;
    updateCodeGroup(id: number, dto: any, userId: number): Promise<import("./entities/item-code-group.entity").ItemCodeGroup>;
    update(id: number, dto: UpdateItemDto, userId: number): Promise<import("./entities/item.entity").Item>;
    removeItemType(id: number): Promise<void>;
    removeCodeGroup(id: number): Promise<void>;
    remove(id: number): Promise<void>;
}
