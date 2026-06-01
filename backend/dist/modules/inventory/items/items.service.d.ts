import { StreamableFile } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto, ImportItemDto, UpdateItemTypeDto, UpdateQuantityTypeDto, UpdateItemCodeGroupDto } from '../dto/inventory.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { ItemsReportsService } from './items-reports.service';
import { ItemsTransactionsService } from './items-transactions.service';
export declare class ItemsService {
    private readonly reportsService;
    private readonly transactionsService;
    constructor(reportsService: ItemsReportsService, transactionsService: ItemsTransactionsService);
    findAll(query: ItemsQueryDto): Promise<PaginatedResult<Item>>;
    findOne(id: string): Promise<Item>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        lowStock: number;
    }>;
    exportToExcel(query: ItemsQueryDto): Promise<StreamableFile>;
    findAllItemTypes(): Promise<ItemType[]>;
    findAllItemCodeGroups(): Promise<ItemCodeGroup[]>;
    findAllQuantityTypes(): Promise<QuantityType[]>;
    create(dto: CreateItemDto, userId: string): Promise<Item>;
    update(id: string, dto: UpdateItemDto, userId: string): Promise<Item>;
    importItems(items: ImportItemDto[], userId: string): Promise<{
        updatedCount: number;
        insertedCount: number;
        errors: string[];
    }>;
    importFromExcel(buffer: Buffer, userId: string): Promise<{
        updatedCount: number;
        insertedCount: number;
        errors: string[];
    }>;
    getImportTemplate(): Promise<StreamableFile>;
    softDelete(id: string, currentUserId: string): Promise<void>;
    createItemType(dto: CreateItemTypeDto, userId: string): Promise<ItemType>;
    updateItemType(id: string, dto: UpdateItemTypeDto, userId: string): Promise<ItemType>;
    softDeleteItemType(id: string): Promise<void>;
    createItemCodeGroup(dto: CreateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup>;
    updateItemCodeGroup(id: string, dto: UpdateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup>;
    softDeleteItemCodeGroup(id: string): Promise<void>;
    createQuantityType(dto: CreateQuantityTypeDto, userId: string): Promise<QuantityType>;
    updateQuantityType(id: string, dto: UpdateQuantityTypeDto, userId: string): Promise<QuantityType>;
    softDeleteQuantityType(id: string): Promise<void>;
}
