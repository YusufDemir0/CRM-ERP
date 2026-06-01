import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, UpdateItemTypeDto, CreateQuantityTypeDto, UpdateQuantityTypeDto, CreateItemCodeGroupDto, UpdateItemCodeGroupDto, ImportItemDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CurrenciesService } from '../../finance/currencies/currencies.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { ItemsReportsService } from './items-reports.service';
export declare class ItemsTransactionsService {
    private itemRepo;
    private itemTypeRepo;
    private qtyTypeRepo;
    private codeGroupRepo;
    private stockRepo;
    private sequenceGenerator;
    private currenciesService;
    private transactionContext;
    private reportsService;
    constructor(itemRepo: Repository<Item>, itemTypeRepo: Repository<ItemType>, qtyTypeRepo: Repository<QuantityType>, codeGroupRepo: Repository<ItemCodeGroup>, stockRepo: Repository<Stock>, sequenceGenerator: SequenceGeneratorService, currenciesService: CurrenciesService, transactionContext: TransactionContextService, reportsService: ItemsReportsService);
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
    softDelete(id: string, currentUserId: string): Promise<void>;
    private validateUsage;
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
