import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { Stock } from '../stocks/entities/stock.entity';
import {
  CreateItemDto,
  UpdateItemDto,
  CreateItemTypeDto,
  CreateQuantityTypeDto,
  CreateItemCodeGroupDto,
  ItemsQueryDto,
  ImportItemDto,
  UpdateItemTypeDto,
  UpdateQuantityTypeDto,
  UpdateItemCodeGroupDto
} from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { CurrenciesService } from '../../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';
import { Transactional } from '@nestjs-cls/transactional';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';

import { Department } from '../../departments/entities/department.entity';
import { BomItem } from '../../production/entities/bom-item.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(ItemType) private itemTypeRepo: Repository<ItemType>,
    @InjectRepository(QuantityType) private qtyTypeRepo: Repository<QuantityType>,
    @InjectRepository(ItemCodeGroup) private codeGroupRepo: Repository<ItemCodeGroup>,
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private currenciesService: CurrenciesService,
    private transactionContext: TransactionContextService,
  ) { }

  // ────── ITEMS ──────

  async findAll(query: ItemsQueryDto): Promise<PaginatedResult<Item>> {
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoin('item.itemType', 'itemType')
      .leftJoin('item.quantityType', 'quantityType')
      .leftJoin('item.provider', 'provider')
      .leftJoin('item.currency', 'currency')
      .select([
        'item.id', 'item.name', 'item.code', 'item.code1', 'item.code2',
        'item.purchasePrice', 'item.salePrice', 'item.totalStock',
        'item.criticalLimit', 'item.state', 'item.createdAt',
        'itemType.id', 'itemType.name',
        'quantityType.id', 'quantityType.abbreviation',
        'provider.id', 'provider.name',
        'currency.id', 'currency.symbol'
      ]);

    // 1. Explicit Whitelist Filtering
    if (query.search) {
      const searchPattern = query.search.replace(/[+><()~*\"@\-]/g, ' ').trim();
      if (searchPattern) {
        qb.andWhere('MATCH(item.name, item.code, item.code1, item.code2, item.description, item.notes) AGAINST(:s IN BOOLEAN MODE)', { s: `*${searchPattern}*` });
      }
    }

    if (query.itemTypeId) qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
    if (query.providerId) qb.andWhere('item.providerId = :providerId', { providerId: query.providerId });
    if (query.currencyId) qb.andWhere('item.currencyId = :currencyId', { currencyId: query.currencyId });
    if (query.state !== undefined) qb.andWhere('item.state = :state', { state: query.state });

    if (query.critical === 'true') {
      qb.andWhere('item.totalStock < item.criticalLimit AND item.criticalLimit > 0');
    }

    // 2. Optimized Sorting
    const sortFieldMap: Record<string, string> = {
      'name': 'item.name',
      'code': 'item.code',
      'purchasePrice': 'item.purchasePrice',
      'totalStock': 'item.totalStock',
      'createdAt': 'item.createdAt'
    };

    const sortCol = sortFieldMap[query.sortBy || ''] || 'item.createdAt';
    qb.orderBy(sortCol, query.sortOrderSafe);
    
    // 3. Pagination
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    
    return {
      data,
      meta: { 
        total, 
        page: query.page || 1, 
        limit: query.limit || 20, 
        totalPages: Math.ceil(total / (query.limit || 20)) 
      },
    };
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.transactionContext.manager.findOne(Item, {
      where: { id },
      relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
    });
    if (!item) throw new NotFoundException('Ürün bulunamadı');
    return item;
  }

  @Transactional()
  async create(dto: CreateItemDto, userId?: number): Promise<Item> {
    const manager = this.transactionContext.manager;

    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = Number(defaultCurrency.id);
      } catch (error) {
        console.warn('Default currency not found in ItemsService, setting to null');
      }
    }

    const code = await this.sequenceGenerator.generateItemCode(manager, dto.itemCodeGroupId);

    const existing = await manager.findOne(Item, { where: { code } });
    if (existing) {
      throw new BadRequestException(`'${code}' kodlu bir ürün zaten mevcut.`);
    }

    const item = manager.create(Item, {
      ...dto,
      code,
      movingAverageCost: new Decimal(0),
      createdBy: userId,
    });

    const savedItem = await manager.save(item);

    // [REQ] Auto-create stock records for all active departments
    const departments = await manager.find(Department, { where: { state: 1 } });
    
    const initialStocks = departments.map(dept => manager.create(Stock, {
      itemId: savedItem.id,
      departmentId: dept.id,
      quantity: new Decimal(0),
      reservedQuantity: new Decimal(0),
      createdBy: userId
    }));

    if (initialStocks.length > 0) {
      await manager.save(Stock, initialStocks);
    }

    return savedItem;
  }

  @Transactional()
  async update(id: number, dto: UpdateItemDto, userId?: number): Promise<Item> {
    const item = await this.findOne(id);

    const updateData: Partial<Item> = {
      updatedBy: userId || null
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.itemTypeId !== undefined) updateData.itemTypeId = dto.itemTypeId;
    if (dto.itemCodeGroupId !== undefined) updateData.itemCodeGroupId = dto.itemCodeGroupId;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.code1 !== undefined) updateData.code1 = dto.code1;
    if (dto.code2 !== undefined) updateData.code2 = dto.code2;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.currencyId !== undefined) updateData.currencyId = dto.currencyId;
    if (dto.quantityTypeId !== undefined) updateData.quantityTypeId = dto.quantityTypeId;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.providerId !== undefined) updateData.providerId = dto.providerId;
    
    if (dto.state === 0 && item.state !== 0) {
      await this.validateUsage(id);
    }
    if (dto.state !== undefined) updateData.state = dto.state;

    if (dto.criticalLimit !== undefined) updateData.criticalLimit = dto.criticalLimit;
    if (dto.purchasePrice !== undefined) updateData.purchasePrice = dto.purchasePrice;
    if (dto.salePrice !== undefined) updateData.salePrice = dto.salePrice;
    if (dto.netPrice !== undefined) updateData.netPrice = dto.netPrice;
    if (dto.kdv !== undefined) updateData.kdv = dto.kdv;

    await this.itemRepo.update(id, updateData);
    return this.findOne(id);
  }

  @Transactional()
  async importItems(items: ImportItemDto[], userId: number) {
    const manager = this.transactionContext.manager;
    
    let updatedCount = 0;
    let insertedCount = 0;
    const errors: string[] = [];

    // Pre-fetch defaults
    const defaultCurrency = await this.currenciesService.getDefault();
    const defaultCurrencyId = defaultCurrency ? Number(defaultCurrency.id) : null;
    const defaultItemType = await manager.findOne(ItemType, { where: { state: 1 } });
    const defaultQtyType = await manager.findOne(QuantityType, { where: { state: 1 } });
    const departments = await manager.find(Department, { where: { state: 1 } });

    if (!defaultItemType || !defaultQtyType) {
      throw new BadRequestException('Sistemde tanımlı Ürün Tipi veya Birim bulunamadı. İçe aktarım yapılamaz.');
    }

    for (const [index, row] of items.entries()) {
      try {
        const { code, name, purchasePrice, salePrice, criticalLimit, kdv } = row;
        
        if (!code || !name) {
          errors.push(`Satır ${index + 1}: Kod ve İsim zorunludur.`);
          continue;
        }

        const existingItem = await manager.findOne(Item, { where: { code } });

        if (existingItem) {
          // UPDATE
          await manager.update(Item, existingItem.id, {
            name: name.toLocaleUpperCase('tr-TR'),
            purchasePrice: purchasePrice !== undefined ? new Decimal(purchasePrice) : existingItem.purchasePrice,
            salePrice: salePrice !== undefined ? new Decimal(salePrice) : existingItem.salePrice,
            criticalLimit: criticalLimit !== undefined ? new Decimal(criticalLimit) : existingItem.criticalLimit,
            kdv: kdv !== undefined ? new Decimal(kdv) : existingItem.kdv,
            updatedBy: userId
          });
          updatedCount++;
        } else {
          // INSERT
          const newItem = manager.create(Item, {
            name: name.toLocaleUpperCase('tr-TR'),
            code,
            itemTypeId: defaultItemType.id,
            quantityTypeId: defaultQtyType.id,
            currencyId: defaultCurrencyId,
            purchasePrice: new Decimal(purchasePrice || 0),
            salePrice: new Decimal(salePrice || 0),
            criticalLimit: new Decimal(criticalLimit || 0),
            kdv: new Decimal(kdv || 20),
            movingAverageCost: new Decimal(0),
            createdBy: userId,
          });
          
          const savedItem = await manager.save(Item, newItem);

          // Auto-create stock records
          const initialStocks = departments.map(dept => manager.create(Stock, {
            itemId: savedItem.id,
            departmentId: dept.id,
            quantity: new Decimal(0),
            reservedQuantity: new Decimal(0),
            createdBy: userId
          }));

          if (initialStocks.length > 0) {
            await manager.save(Stock, initialStocks);
          }
          
          insertedCount++;
        }
      } catch (err) {
        errors.push(`Satır ${index + 1}: İşlem hatası (${err instanceof Error ? err.message : String(err)})`);
      }
    }

    return { updatedCount, insertedCount, errors };
  }

  async softDelete(id: number, currentUserId?: number): Promise<void> {
    await this.findOne(id);
    await this.validateUsage(id);

    await this.itemRepo.update(id, {
      state: 0,
      updatedBy: currentUserId || null,
    });
    await this.itemRepo.softDelete(id);
  }

  /**
   * [SEC-03] Usage check before deactivation or deletion
   */
  private async validateUsage(id: number) {
    const manager = this.transactionContext.manager;
    
    // 1. Stock check
    const totalQtyResult = await manager.createQueryBuilder(Stock, 'stock')
      .where('stock.itemId = :id', { id })
      .select('SUM(stock.quantity)', 'total')
      .getRawOne();
    
    const totalQty = new Decimal(totalQtyResult?.total || 0);
    if (!totalQty.isZero()) {
      throw new BadRequestException(`Stokta ${totalQty.toString()} adet ürün bulunduğu için işlem yapılamaz.`);
    }

    // 2. BOM usage check
    const bomUsage = await manager.count(BomItem, { where: { itemId: id } });
    if (bomUsage > 0) {
      throw new BadRequestException(`Bu ürün ${bomUsage} adet üretim reçetesinde (BOM) kullanılmaktadır.`);
    }
  }

  // ────── ITEM TYPES ──────

  async findAllItemTypes(): Promise<ItemType[]> {
    return this.itemTypeRepo.find();
  }

  async createItemType(dto: CreateItemTypeDto, userId?: number): Promise<ItemType> {
    const type = this.itemTypeRepo.create({ ...dto, createdBy: userId });
    return this.itemTypeRepo.save(type);
  }

  async updateItemType(id: number, dto: UpdateItemTypeDto, userId?: number): Promise<ItemType> {
    const type = await this.itemTypeRepo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Ürün tipi bulunamadı');

    if (dto.state === 0) {
      const activeItems = await this.itemRepo.count({ where: { itemTypeId: id, state: 1 } });
      if (activeItems > 0) {
        throw new BadRequestException(`Bu türde ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
      }
    }

    if (dto.name !== undefined) type.name = dto.name;
    if (dto.abbreviation !== undefined) type.abbreviation = dto.abbreviation;
    if (dto.state !== undefined) type.state = dto.state;
    if (dto.isExcludedFromBom !== undefined) type.isExcludedFromBom = dto.isExcludedFromBom;

    type.updatedBy = userId || null;
    return this.itemTypeRepo.save(type);
  }

  async softDeleteItemType(id: number): Promise<void> {
    const activeItems = await this.itemRepo.count({ where: { itemTypeId: id, state: 1 } });
    if (activeItems > 0) {
      throw new BadRequestException('Bu türde aktif ürünler bulunduğu için silinemez.');
    }
    await this.itemTypeRepo.softDelete(id);
  }

  // ────── ITEM CODE GROUPS ──────

  async findAllItemCodeGroups(): Promise<ItemCodeGroup[]> {
    return this.codeGroupRepo.find();
  }

  async createItemCodeGroup(dto: CreateItemCodeGroupDto, userId?: number): Promise<ItemCodeGroup> {
    const group = this.codeGroupRepo.create({ ...dto, createdBy: userId });
    return this.codeGroupRepo.save(group);
  }

  async updateItemCodeGroup(id: number, dto: UpdateItemCodeGroupDto, userId?: number): Promise<ItemCodeGroup> {
    const group = await this.codeGroupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Ürün kod grubu bulunamadı');

    if (dto.state === 0) {
      const activeItems = await this.itemRepo.count({ where: { itemCodeGroupId: id, state: 1 } });
      if (activeItems > 0) {
        throw new BadRequestException(`Bu grupta ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
      }
    }

    if (dto.name !== undefined) group.name = dto.name;
    if (dto.prefix !== undefined) group.prefix = dto.prefix;
    if (dto.state !== undefined) group.state = dto.state;

    group.updatedBy = userId || null;
    return this.codeGroupRepo.save(group);
  }

  async softDeleteItemCodeGroup(id: number): Promise<void> {
    const activeItems = await this.itemRepo.count({ where: { itemCodeGroupId: id, state: 1 } });
    if (activeItems > 0) {
      throw new BadRequestException('Bu grupta aktif ürünler bulunduğu için silinemez.');
    }
    await this.codeGroupRepo.softDelete(id);
  }

  // ────── QUANTITY TYPES ──────

  async findAllQuantityTypes(): Promise<QuantityType[]> {
    return this.qtyTypeRepo.find();
  }

  async createQuantityType(dto: CreateQuantityTypeDto, userId?: number): Promise<QuantityType> {
    const type = this.qtyTypeRepo.create({ ...dto, createdBy: userId });
    return this.qtyTypeRepo.save(type);
  }

  async updateQuantityType(id: number, dto: UpdateQuantityTypeDto, userId?: number): Promise<QuantityType> {
    const type = await this.qtyTypeRepo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Birim bulunamadı');

    if (dto.state === 0) {
      const activeItems = await this.itemRepo.count({ where: { quantityTypeId: id, state: 1 } });
      if (activeItems > 0) {
        throw new BadRequestException(`Bu birimi kullanan ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
      }
    }

    if (dto.name !== undefined) type.name = dto.name;
    if (dto.abbreviation !== undefined) type.abbreviation = dto.abbreviation;
    if (dto.state !== undefined) type.state = dto.state;

    type.updatedBy = userId || null;
    return this.qtyTypeRepo.save(type);
  }

  async softDeleteQuantityType(id: number): Promise<void> {
    const activeItems = await this.itemRepo.count({ where: { quantityTypeId: id, state: 1 } });
    if (activeItems > 0) {
      throw new BadRequestException('Bu birimi kullanan aktif ürünler bulunduğu için silinemez.');
    }
    await this.qtyTypeRepo.softDelete(id);
  }

  async getStatus() {
    const [active, passive, lowStock] = await Promise.all([
      this.itemRepo.count({ where: { state: 1 } }),
      this.itemRepo.count({ where: { state: 0 } }),
      this.itemRepo.count({ where: { state: 1, criticalLimit: MoreThan(0 as unknown as Decimal) } }),
    ]);
    return { active, passive, total: active + passive, lowStock };
  }
}
