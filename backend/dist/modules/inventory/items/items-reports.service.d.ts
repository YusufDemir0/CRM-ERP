import { StreamableFile } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { ItemsQueryDto } from '../dto/inventory.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
export declare class ItemsReportsService {
    private itemRepo;
    private itemTypeRepo;
    private qtyTypeRepo;
    private codeGroupRepo;
    constructor(itemRepo: Repository<Item>, itemTypeRepo: Repository<ItemType>, qtyTypeRepo: Repository<QuantityType>, codeGroupRepo: Repository<ItemCodeGroup>);
    findAll(query: ItemsQueryDto): Promise<PaginatedResult<Item>>;
    findOne(id: string, manager?: EntityManager): Promise<Item>;
    findAllItemTypes(): Promise<ItemType[]>;
    findAllItemCodeGroups(): Promise<ItemCodeGroup[]>;
    findAllQuantityTypes(): Promise<QuantityType[]>;
    getStatus(): Promise<{
        active: number;
        passive: number;
        total: number;
        lowStock: number;
    }>;
    exportToExcel(query: ItemsQueryDto): Promise<StreamableFile>;
    getImportTemplate(): Promise<StreamableFile>;
}
