import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto } from '../dto/inventory.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
    findAll(query: PaginationDto & {
        itemTypeId?: number;
    }): Promise<import("../../../common/dto/pagination.dto").PaginatedResult<import("./entities/item.entity").Item>>;
    findAllItemTypes(): Promise<import("./entities/item-type.entity").ItemType[]>;
    findAllQuantityTypes(): Promise<import("./entities/quantity-type.entity").QuantityType[]>;
    findOne(id: number): Promise<import("./entities/item.entity").Item>;
    create(dto: CreateItemDto, userId: number): Promise<import("./entities/item.entity").Item>;
    createItemType(dto: CreateItemTypeDto, userId: number): Promise<import("./entities/item-type.entity").ItemType>;
    createQuantityType(dto: CreateQuantityTypeDto, userId: number): Promise<import("./entities/quantity-type.entity").QuantityType>;
    update(id: number, dto: UpdateItemDto, userId: number): Promise<import("./entities/item.entity").Item>;
    remove(id: number): Promise<void>;
}
