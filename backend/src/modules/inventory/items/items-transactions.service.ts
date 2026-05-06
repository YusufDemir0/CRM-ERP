import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transactional } from '@nestjs-cls/transactional';

import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Department } from '../../departments/entities/department.entity';
import { BomItem } from '../../production/entities/bom-item.entity';

import {
  CreateItemDto,
  UpdateItemDto,
  CreateItemTypeDto,
  UpdateItemTypeDto,
  CreateQuantityTypeDto,
  UpdateQuantityTypeDto,
  CreateItemCodeGroupDto,
  UpdateItemCodeGroupDto,
  ImportItemDto
} from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { CurrenciesService } from '../../finance/currencies/currencies.service';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { ItemsReportsService } from './items-reports.service';

@Injectable()
export class ItemsTransactionsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(ItemType) private itemTypeRepo: Repository<ItemType>,
    @InjectRepository(QuantityType) private qtyTypeRepo: Repository<QuantityType>,
    @InjectRepository(ItemCodeGroup) private codeGroupRepo: Repository<ItemCodeGroup>,
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    private sequenceGenerator: SequenceGeneratorService,
    private currenciesService: CurrenciesService,
    private transactionContext: TransactionContextService,
    private reportsService: ItemsReportsService,
  ) {}

  @Transactional()
  async create(dto: CreateItemDto, userId: string): Promise<Item> {
    const manager = this.transactionContext.manager;

    if (!dto.currencyId) {
      try {
        const defaultCurrency = await this.currenciesService.getDefault();
        dto.currencyId = String(defaultCurrency.id);
      } catch (error) {}
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
    const item = await this.reportsService.findOne(id);

    const updateData: Partial<Item> = {
      updatedBy: userId || null
    };

    const updatableFields: (keyof UpdateItemDto)[] = [
      'name', 'itemTypeId', 'itemCodeGroupId', 'code', 'code1', 'code2',
      'image', 'currencyId', 'quantityTypeId', 'description', 'notes',
      'providerId', 'state', 'criticalLimit', 'purchasePrice', 'salePrice',
      'netPrice', 'kdv'
    ];

    updatableFields.forEach(field => {
      if (dto[field] !== undefined) (updateData as any)[field] = dto[field];
    });
    
    if (dto.state === 0 && item.state !== 0) {
      await this.validateUsage(id);
    }

    await this.itemRepo.update(id, updateData);
    return this.reportsService.findOne(id);
  }

  @Transactional()
  async importItems(items: ImportItemDto[], userId: string) {
    const manager = this.transactionContext.manager;
    let updatedCount = 0;
    let insertedCount = 0;
    const errors: string[] = [];

    const itemCodes = items.map(i => i.code?.trim()).filter(Boolean);
    if (itemCodes.length === 0) throw new BadRequestException('Aktarılacak geçerli ürün kodu bulunamadı.');

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

    for (const [index, row] of items.entries()) {
      if (!row.code || !row.name) {
        errors.push(`Satır ${index + 1}: Kod ve İsim zorunludur.`);
        continue;
      }

      const typeId = row.typeName ? typeMap.get(row.typeName.trim().toLocaleLowerCase('tr-TR')) || defaultTypeId : defaultTypeId;
      const qtyId = row.unitName ? qtyMap.get(row.unitName.trim().toLocaleLowerCase('tr-TR')) || defaultQtyId : defaultQtyId;

      const existing = existingMap.get(row.code.trim());

      if (existing) {
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

    if (itemsToUpdate.length > 0) await manager.save(Item, itemsToUpdate);
    
    if (newItemsToSave.length > 0) {
      const savedNewItems = await manager.save(Item, newItemsToSave);
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
      if (initialStocks.length > 0) await manager.save(Stock, initialStocks, { chunk: 100 }); 
    }

    return { updatedCount, insertedCount, errors };
  }

  async softDelete(id: string, currentUserId: string): Promise<void> {
    await this.reportsService.findOne(id);
    await this.validateUsage(id);

    await this.itemRepo.update(id, {
      state: 0,
      updatedBy: currentUserId || null,
    });
    await this.itemRepo.softDelete(id);
  }

  private async validateUsage(id: string) {
    const manager = this.transactionContext.manager;
    const totalQtyResult = await manager.createQueryBuilder(Stock, 'stock')
      .where('stock.itemId = :id', { id })
      .select('SUM(stock.quantity)', 'total')
      .getRawOne();
    
    const totalQty = new Decimal(totalQtyResult?.total || 0);
    if (!totalQty.isZero()) throw new BadRequestException(`Stokta ${totalQty.toString()} adet ürün bulunduğu için işlem yapılamaz.`);

    const bomUsage = await manager.count(BomItem, { where: { itemId: id } });
    if (bomUsage > 0) throw new BadRequestException(`Bu ürün ${bomUsage} adet üretim reçetesinde (BOM) kullanılmaktadır.`);
  }

  // ────── ITEM TYPES ──────

  async createItemType(dto: CreateItemTypeDto, userId: string): Promise<ItemType> {
    const type = this.itemTypeRepo.create({ ...dto, createdBy: userId });
    return this.itemTypeRepo.save(type);
  }

  async updateItemType(id: string, dto: UpdateItemTypeDto, userId: string): Promise<ItemType> {
    const type = await this.itemTypeRepo.findOne({ where: { id: String(id) } });
    if (!type) throw new NotFoundException('Ürün tipi bulunamadı');

    if (dto.state === 0) {
      const activeItems = await this.itemRepo.count({ where: { itemTypeId: id, state: 1 } });
      if (activeItems > 0) throw new BadRequestException(`Bu türde ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
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
    if (activeItems > 0) throw new BadRequestException('Bu türde aktif ürünler bulunduğu için silinemez.');
    await this.itemTypeRepo.softDelete(id);
  }

  // ────── ITEM CODE GROUPS ──────

  async createItemCodeGroup(dto: CreateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup> {
    const group = this.codeGroupRepo.create({ ...dto, createdBy: userId });
    return this.codeGroupRepo.save(group);
  }

  async updateItemCodeGroup(id: string, dto: UpdateItemCodeGroupDto, userId: string): Promise<ItemCodeGroup> {
    const group = await this.codeGroupRepo.findOne({ where: { id: String(id) } });
    if (!group) throw new NotFoundException('Ürün kod grubu bulunamadı');

    if (dto.state === 0) {
      const activeItems = await this.itemRepo.count({ where: { itemCodeGroupId: id, state: 1 } });
      if (activeItems > 0) throw new BadRequestException(`Bu grupta ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
    }

    if (dto.name !== undefined) group.name = dto.name;
    if (dto.prefix !== undefined) group.prefix = dto.prefix;
    if (dto.state !== undefined) group.state = dto.state;

    group.updatedBy = userId || null;
    return this.codeGroupRepo.save(group);
  }

  async softDeleteItemCodeGroup(id: string): Promise<void> {
    const activeItems = await this.itemRepo.count({ where: { itemCodeGroupId: id, state: 1 } });
    if (activeItems > 0) throw new BadRequestException('Bu grupta aktif ürünler bulunduğu için silinemez.');
    await this.codeGroupRepo.softDelete(id);
  }

  // ────── QUANTITY TYPES ──────

  async createQuantityType(dto: CreateQuantityTypeDto, userId: string): Promise<QuantityType> {
    const type = this.qtyTypeRepo.create({ ...dto, createdBy: userId });
    return this.qtyTypeRepo.save(type);
  }

  async updateQuantityType(id: string, dto: UpdateQuantityTypeDto, userId: string): Promise<QuantityType> {
    const type = await this.qtyTypeRepo.findOne({ where: { id: String(id) } });
    if (!type) throw new NotFoundException('Birim bulunamadı');

    if (dto.state === 0) {
      const activeItems = await this.itemRepo.count({ where: { quantityTypeId: id, state: 1 } });
      if (activeItems > 0) throw new BadRequestException(`Bu birimi kullanan ${activeItems} adet aktif ürün bulunduğu için pasife alınamaz.`);
    }

    if (dto.name !== undefined) type.name = dto.name;
    if (dto.abbreviation !== undefined) type.abbreviation = dto.abbreviation;
    if (dto.state !== undefined) type.state = dto.state;

    type.updatedBy = userId || null;
    return this.qtyTypeRepo.save(type);
  }

  async softDeleteQuantityType(id: string): Promise<void> {
    const activeItems = await this.itemRepo.count({ where: { quantityTypeId: id, state: 1 } });
    if (activeItems > 0) throw new BadRequestException('Bu birimi kullanan aktif ürünler bulunduğu için silinemez.');
    await this.qtyTypeRepo.softDelete(id);
  }
}
