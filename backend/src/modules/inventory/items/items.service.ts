import { Injectable, NotFoundException, BadRequestException, StreamableFile } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
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

    // Pre-fetch all types and units for mapping
    const [itemTypes, qtyTypes] = await Promise.all([
      manager.find(ItemType, { where: { state: 1 } }),
      manager.find(QuantityType, { where: { state: 1 } })
    ]);

    if (itemTypes.length === 0 || qtyTypes.length === 0) {
      throw new BadRequestException('Sistemde tanımlı Ürün Tipi veya Birim bulunamadı. İçe aktarım yapılamaz.');
    }

    const itemTypeMap = new Map(itemTypes.map(t => [t.name.trim().toLocaleLowerCase('tr-TR'), t.id.toString()]));
    const qtyTypeMap = new Map(qtyTypes.map(t => [t.name.trim().toLocaleLowerCase('tr-TR'), t.id.toString()]));
    
    const defaultItemTypeId = itemTypes[0].id.toString();
    const defaultQtyTypeId = qtyTypes[0].id.toString();

    const defaultCurrency = await this.currenciesService.getDefault();
    const defaultCurrencyId = defaultCurrency ? String(defaultCurrency.id) : null;
    const departments = await manager.find(Department, { where: { state: 1 } });

    for (const [index, row] of items.entries()) {
      try {
        const { code, name, typeName, unitName, purchasePrice, salePrice, criticalLimit, kdv } = row;
        
        if (!code || !name) {
          errors.push(`Satır ${index + 1}: Kod ve İsim zorunludur.`);
          continue;
        }

        const existingItem = await manager.findOne(Item, { where: { code } });

        // Resolve IDs by name or fallback to default
        const resolvedItemTypeId = typeName ? (itemTypeMap.get(typeName.trim().toLocaleLowerCase('tr-TR')) || defaultItemTypeId) : defaultItemTypeId;
        const resolvedQtyTypeId = unitName ? (qtyTypeMap.get(unitName.trim().toLocaleLowerCase('tr-TR')) || defaultQtyTypeId) : defaultQtyTypeId;

        if (existingItem) {
          // UPDATE
          await manager.update(Item, existingItem.id, {
            name: name.toLocaleUpperCase('tr-TR'),
            itemTypeId: resolvedItemTypeId,
            quantityTypeId: resolvedQtyTypeId,
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
            name: name.trim().toLocaleUpperCase('tr-TR'),
            code: code.trim(),
            itemTypeId: resolvedItemTypeId,
            quantityTypeId: resolvedQtyTypeId,
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
            itemId: String(savedItem.id),
            departmentId: String(dept.id),
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
