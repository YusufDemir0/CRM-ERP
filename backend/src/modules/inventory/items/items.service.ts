import { Injectable, NotFoundException, BadRequestException, StreamableFile } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, In } from 'typeorm';
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

  async findOne(id: string): Promise<Item> {
    const item = await this.transactionContext.manager.findOne(Item, {
      where: { id: String(id) },
      relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
    });
    if (!item) throw new NotFoundException('Ürün bulunamadı');
    return item;
  }

  @Transactional()
  async create(dto: CreateItemDto, userId: string): Promise<Item> {
    const manager = this.transactionContext.manager;

    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = String(defaultCurrency.id);
      } catch (error) {
        // Silently continue or handle as per business rules
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
      itemId: String(savedItem.id),
      departmentId: String(dept.id),
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
  async update(id: string, dto: UpdateItemDto, userId: string): Promise<Item> {
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
  async importItems(items: ImportItemDto[], userId: string) {
    const manager = this.transactionContext.manager;
    let updatedCount = 0;
    let insertedCount = 0;
    const errors: string[] = [];

    // 1. Get all codes
    const itemCodes = items.map(i => i.code?.trim()).filter(Boolean);
    
    if (itemCodes.length === 0) {
      throw new BadRequestException('Aktarılacak geçerli ürün kodu bulunamadı.');
    }

    // 2. Fetch lookups to RAM (avoids N+1)
    const [existingItems, itemTypes, qtyTypes, departments, defaultCurrency] = await Promise.all([
      manager.find(Item, { where: { code: In(itemCodes) } }),
      manager.find(ItemType, { where: { state: 1 } }),
      manager.find(QuantityType, { where: { state: 1 } }),
      manager.find(Department, { where: { state: 1 } }),
      this.currenciesService.getDefault()
    ]);

    const defaultCurrencyId = defaultCurrency ? String(defaultCurrency.id) : null;

    if (itemTypes.length === 0 || qtyTypes.length === 0) {
      throw new BadRequestException('Sistemde tanımlı Ürün Tipi veya Birim bulunamadı. İçe aktarım yapılamaz.');
    }

    const existingMap = new Map(existingItems.map(i => [i.code, i]));
    const typeMap = new Map(itemTypes.map(t => [t.name.trim().toLocaleLowerCase('tr-TR'), String(t.id)]));
    const qtyMap = new Map(qtyTypes.map(q => [q.name.trim().toLocaleLowerCase('tr-TR'), String(q.id)]));

    const defaultTypeId = String(itemTypes[0]?.id);
    const defaultQtyId = String(qtyTypes[0]?.id);

    const newItemsToSave: Item[] = [];
    const itemsToUpdate: Item[] = [];

    // 3. Match in memory O(1)
    for (const [index, row] of items.entries()) {
      if (!row.code || !row.name) {
        errors.push(`Satır ${index + 1}: Kod ve İsim zorunludur.`);
        continue;
      }

      const typeId = row.typeName ? typeMap.get(row.typeName.trim().toLocaleLowerCase('tr-TR')) || defaultTypeId : defaultTypeId;
      const qtyId = row.unitName ? qtyMap.get(row.unitName.trim().toLocaleLowerCase('tr-TR')) || defaultQtyId : defaultQtyId;

      const existing = existingMap.get(row.code.trim());

      if (existing) {
        // PREPARE UPDATE
        existing.name = row.name.toLocaleUpperCase('tr-TR');
        existing.itemTypeId = typeId;
        existing.quantityTypeId = qtyId;
        if (row.purchasePrice !== undefined) existing.purchasePrice = new Decimal(row.purchasePrice);
        if (row.salePrice !== undefined) existing.salePrice = new Decimal(row.salePrice);
        if (row.kdv !== undefined) existing.kdv = new Decimal(row.kdv);
        if (row.criticalLimit !== undefined) existing.criticalLimit = new Decimal(row.criticalLimit);
        existing.updatedBy = userId;
        itemsToUpdate.push(existing);
        updatedCount++;
      } else {
        // PREPARE INSERT
        const newItem = manager.create(Item, {
          code: row.code.trim(),
          name: row.name.trim().toLocaleUpperCase('tr-TR'),
          itemTypeId: typeId,
          quantityTypeId: qtyId,
          currencyId: defaultCurrencyId,
          purchasePrice: new Decimal(row.purchasePrice || 0),
          salePrice: new Decimal(row.salePrice || 0),
          kdv: new Decimal(row.kdv ?? 20),
          criticalLimit: new Decimal(row.criticalLimit || 0),
          movingAverageCost: new Decimal(0),
          createdBy: userId,
        });
        newItemsToSave.push(newItem);
        insertedCount++;
      }
    }

    // 4. Bulk DB Operations (Very Fast)
    if (itemsToUpdate.length > 0) {
      await manager.save(Item, itemsToUpdate);
    }
    
    if (newItemsToSave.length > 0) {
      const savedNewItems = await manager.save(Item, newItemsToSave);
      
      // Open stock records for new items with 0 quantity across all departments
      const initialStocks = [];
      for (const item of savedNewItems) {
        for (const dept of departments) {
          initialStocks.push(manager.create(Stock, {
            itemId: String(item.id),
            departmentId: String(dept.id),
            quantity: new Decimal(0),
            reservedQuantity: new Decimal(0),
            createdBy: userId
          }));
        }
      }
      
      if (initialStocks.length > 0) {
        // Bulk save stocks with chunking for performance
        await manager.save(Stock, initialStocks, { chunk: 100 }); 
      }
    }

    return { updatedCount, insertedCount, errors };
  }

  async exportToExcel(query: ItemsQueryDto): Promise<StreamableFile> {
    query.limit = 10000;
    const { data: items } = await this.findAll(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ürün Listesi');

    worksheet.columns = [
      { header: 'KOD', key: 'code', width: 20 },
      { header: 'ÜRÜN ADI', key: 'name', width: 40 },
      { header: 'TÜR', key: 'itemType', width: 20 },
      { header: 'BİRİM', key: 'quantityType', width: 15 },
      { header: 'STOK', key: 'totalStock', width: 15 },
      { header: 'ALIŞ FİYATI', key: 'purchasePrice', width: 15 },
      { header: 'SATIŞ FİYATI', key: 'salePrice', width: 15 },
      { header: 'KDV', key: 'kdv', width: 10 },
      { header: 'KRİTİK LİMİT', key: 'criticalLimit', width: 15 },
    ];

    items.forEach(item => {
      worksheet.addRow({
        code: item.code,
        name: item.name,
        itemType: item.itemType?.name || '',
        quantityType: item.quantityType?.abbreviation || '',
        totalStock: Number(item.totalStock || 0),
        purchasePrice: Number(item.purchasePrice || 0),
        salePrice: Number(item.salePrice || 0),
        kdv: Number(item.kdv || 0),
        criticalLimit: Number(item.criticalLimit || 0),
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }

  async softDelete(id: string, currentUserId: string): Promise<void> {
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
  private async validateUsage(id: string) {
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

  async createItemType(dto: CreateItemTypeDto, userId: string): Promise<ItemType> {
    const type = this.itemTypeRepo.create({ ...dto, createdBy: userId });
    return this.itemTypeRepo.save(type);
  }

  async updateItemType(id: string, dto: UpdateItemTypeDto, userId: string): Promise<ItemType> {
    const type = await this.itemTypeRepo.findOne({ where: { id: String(id) } });
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

  async softDeleteItemType(id: string): Promise<void> {
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

  async createItemCodeGroup(dto: CreateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup> {
    const group = this.codeGroupRepo.create({ ...dto, createdBy: userId });
    return this.codeGroupRepo.save(group);
  }

  async updateItemCodeGroup(id: string, dto: UpdateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup> {
    const group = await this.codeGroupRepo.findOne({ where: { id: String(id) } });
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

  async softDeleteItemCodeGroup(id: string): Promise<void> {
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

  async createQuantityType(dto: CreateQuantityTypeDto, userId: string): Promise<QuantityType> {
    const type = this.qtyTypeRepo.create({ ...dto, createdBy: userId });
    return this.qtyTypeRepo.save(type);
  }

  async updateQuantityType(id: string, dto: UpdateQuantityTypeDto, userId: string): Promise<QuantityType> {
    const type = await this.qtyTypeRepo.findOne({ where: { id: String(id) } });
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

  async softDeleteQuantityType(id: string): Promise<void> {
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
      this.itemRepo.createQueryBuilder('item').where('item.state = 1 AND item.criticalLimit > 0').getCount(),
    ]);
    return { active, passive, total: active + passive, lowStock };
  }
}
