import { Repository, DataSource } from 'typeorm';
import { Item } from './items/entities/item.entity';
import { Stock } from './stocks/entities/stock.entity';
import { BomItem } from '../production/entities/bom-item.entity';
import { ItemsService } from './items/items.service';
export declare class InventoryOrchestratorService {
    private itemRepo;
    private stockRepo;
    private bomItemRepo;
    private dataSource;
    private itemsService;
    constructor(itemRepo: Repository<Item>, stockRepo: Repository<Stock>, bomItemRepo: Repository<BomItem>, dataSource: DataSource, itemsService: ItemsService);
    safeDelete(id: number, userId?: number): Promise<void>;
    safeUpdateState(id: number, newState: number, userId?: number): Promise<void>;
    private validateUsage;
}
