import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transactional } from '@nestjs-cls/transactional';
import * as ExcelJS from 'exceljs';

import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Department } from '../../departments/entities/department.entity';
import { BomItem } from '../../production/entities/bom-item.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';


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

    if (!dto.itemCodeGroupId) {
      throw new BadRequestException('Ürün oluşturulurken bir Kod Grubu seçilmelidir.');
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
      if (dto[field] !== undefined) (updateData as Record<string, unknown>)[field] = dto[field];
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

    // Fetch master references in parallel
    const [itemTypes, qtyTypes, codeGroups, currencies, departments, defaultCurrency] = await Promise.all([
      manager.find(ItemType, { where: { state: 1 } }),
      manager.find(QuantityType, { where: { state: 1 } }),
      manager.find(ItemCodeGroup, { where: { state: 1 } }),
      manager.find(Currency, { where: { state: 1 } }),
      manager.find(Department, { where: { state: 1 } }),
      this.currenciesService.getDefault()
    ]);

    const defaultCurrencyId = defaultCurrency ? String(defaultCurrency.id) : null;
    if (itemTypes.length === 0 || qtyTypes.length === 0) {
      throw new BadRequestException('Sistemde tanımlı Ürün Tipi veya Birim bulunamadı. İçe aktarım yapılamaz.');
    }

    const typeMap = new Map(itemTypes.map(t => [t.name.trim().toLocaleLowerCase('tr-TR'), String(t.id)]));
    const typeAbbrMap = new Map(itemTypes.map(t => [t.abbreviation.trim().toLocaleLowerCase('tr-TR'), String(t.id)]));
    const qtyMap = new Map(qtyTypes.map(q => [q.name.trim().toLocaleLowerCase('tr-TR'), String(q.id)]));
    const qtyAbbrMap = new Map(qtyTypes.map(q => [q.abbreviation.trim().toLocaleLowerCase('tr-TR'), String(q.id)]));
    const currencyMap = new Map(currencies.map(c => [c.code.trim().toUpperCase(), String(c.id)]));

    const defaultTypeId = String(itemTypes[0]?.id);
    const defaultQtyId = String(qtyTypes[0]?.id);

    // 1. Construct target codes for existing items lookup
    const targetCodes: string[] = [];
    const rowCodeMap = new Map<number, string>(); // index -> formed code

    for (const [index, row] of items.entries()) {
      if (row.code?.trim()) {
        const c = row.code.trim();
        targetCodes.push(c);
        rowCodeMap.set(index, c);
      } else if (row.codeGroup?.trim() && row.codeSequence?.trim()) {
        const cleanGroup = row.codeGroup.trim().toLowerCase();
        const cg = codeGroups.find(g => 
          g.prefix.toLowerCase() === cleanGroup ||
          g.name.toLowerCase() === cleanGroup
        );
        if (cg) {
          const paddedSeq = row.codeSequence.trim().padStart(3, '0');
          const code = `${cg.prefix}-${paddedSeq}`;
          targetCodes.push(code);
          rowCodeMap.set(index, code);
        }
      }
    }

    // 2. Fetch existing items
    const existingItems = targetCodes.length > 0 
      ? await manager.find(Item, { where: { code: In(targetCodes) } })
      : [];
    const existingMap = new Map(existingItems.map(i => [i.code, i]));

    const newItemsToSave: Item[] = [];
    const itemsToUpdate: Item[] = [];

    // 3. Process each row
    for (const [index, row] of items.entries()) {
      if (!row.name?.trim()) {
        errors.push(`Satır ${index + 2}: 'Ürün Adı' hücresi boş olamaz.`);
        continue;
      }

      // Map Type
      let typeId = defaultTypeId;
      if (row.typeName?.trim()) {
        const cleanType = row.typeName.trim().toLocaleLowerCase('tr-TR');
        const found = typeMap.get(cleanType) || typeAbbrMap.get(cleanType);
        if (found) {
          typeId = found;
        } else {
          errors.push(`Satır ${index + 2}: Belirtilen Ürün Tipi '${row.typeName}' sistemde tanımlı değil. Varsayılan Ürün Tipi '${itemTypes[0]?.name}' olarak ayarlandı.`);
        }
      }

      // Map Unit
      let qtyId = defaultQtyId;
      if (row.unitName?.trim()) {
        const cleanUnit = row.unitName.trim().toLocaleLowerCase('tr-TR');
        const found = qtyMap.get(cleanUnit) || qtyAbbrMap.get(cleanUnit);
        if (found) {
          qtyId = found;
        } else {
          errors.push(`Satır ${index + 2}: Belirtilen Birim '${row.unitName}' sistemde tanımlı değil. Varsayılan Birim '${qtyTypes[0]?.abbreviation}' olarak ayarlandı.`);
        }
      }

      // Map Currency
      let currencyId = defaultCurrencyId;
      if (row.currencyCode?.trim()) {
        const cleanCurr = row.currencyCode.trim().toUpperCase();
        const found = currencyMap.get(cleanCurr);
        if (found) {
          currencyId = found;
        } else {
          const defaultCurrCode = defaultCurrency?.code || 'TRY';
          errors.push(`Satır ${index + 2}: Belirtilen Para Birimi '${row.currencyCode}' sistemde tanımlı değil. Varsayılan Para Birimi '${defaultCurrCode}' olarak ayarlandı.`);
        }
      }

      // Check if it should be an update or insert
      const formedCode = rowCodeMap.get(index);
      const existing = formedCode ? existingMap.get(formedCode) : null;

      if (existing) {
        // Update existing item (Respecting locked fields: code and itemCodeGroupId are NOT updated)
        existing.name = row.name.trim().toLocaleUpperCase('tr-TR');
        existing.itemTypeId = typeId;
        existing.quantityTypeId = qtyId;
        existing.currencyId = currencyId;
        
        if (row.purchasePrice !== undefined) existing.purchasePrice = new Decimal(row.purchasePrice);
        if (row.salePrice !== undefined) existing.salePrice = new Decimal(row.salePrice);
        if (row.kdv !== undefined) existing.kdv = new Decimal(row.kdv);
        if (row.criticalLimit !== undefined) existing.criticalLimit = new Decimal(row.criticalLimit);
        if (row.description !== undefined) existing.description = row.description?.trim() || null;

        existing.updatedBy = userId;
        itemsToUpdate.push(existing);
        updatedCount++;
      } else {
        // If they provided a codeSequence but the product was not found, it is a validation error
        if (row.codeSequence?.trim()) {
          errors.push(`Satır ${index + 2}: '${formedCode || row.codeSequence}' kodlu mevcut bir ürün bulunamadı. Yeni bir ürün eklemek istiyorsanız Kod Sekansı alanını boş bırakın.`);
          continue;
        }

        // It is a NEW item. Must select a Code Group.
        if (!row.codeGroup?.trim()) {
          errors.push(`Satır ${index + 2}: Yeni ürün eklemek için 'Kod Grubu' belirtilmesi zorunludur.`);
          continue;
        }

        const cleanGroup = row.codeGroup.trim().toLowerCase();
        const cg = codeGroups.find(g => 
          g.prefix.toLowerCase() === cleanGroup ||
          g.name.toLowerCase() === cleanGroup
        );

        if (!cg) {
          errors.push(`Satır ${index + 2}: Belirtilen Kod Grubu '${row.codeGroup}' sistemde bulunamadı.`);
          continue;
        }

        // Automatically generate sequence
        let newCode: string;
        try {
          newCode = await this.sequenceGenerator.generateItemCode(manager, String(cg.id));
        } catch (seqErr) {
          errors.push(`Satır ${index + 2}: Kod sekansı üretilirken sistem hatası oluştu: ${seqErr.message}`);
          continue;
        }

        const newItem = manager.create(Item, {
          code: newCode,
          name: row.name.trim().toLocaleUpperCase('tr-TR'),
          itemTypeId: typeId,
          itemCodeGroupId: String(cg.id),
          quantityTypeId: qtyId,
          currencyId,
          purchasePrice: new Decimal(row.purchasePrice || 0),
          salePrice: new Decimal(row.salePrice || 0),
          kdv: new Decimal(row.kdv ?? 20),
          criticalLimit: new Decimal(row.criticalLimit || 0),
          movingAverageCost: new Decimal(0),
          description: row.description?.trim() || null,
          createdBy: userId,
        });

        newItemsToSave.push(newItem);
        insertedCount++;
      }
    }

    try {
      if (itemsToUpdate.length > 0) {
        await manager.save(Item, itemsToUpdate);
      }

      if (newItemsToSave.length > 0) {
        const savedNewItems = await manager.save(Item, newItemsToSave);
        const initialStocks: Stock[] = [];
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
          await manager.save(Stock, initialStocks, { chunk: 100 });
        }
      }
    } catch (dbErr) {
      throw new BadRequestException(`Veritabanı kayıt işlemi başarısız oldu: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
    }

    return { updatedCount, insertedCount, errors };
  }

  @Transactional()
  async importFromExcel(buffer: Buffer, userId: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as never);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('Excel dosyasında geçerli bir çalışma sayfası bulunamadı.');
    }

    const items: ImportItemDto[] = [];
    const errors: string[] = [];

    // Parse rows, skipping header (row 1)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const codeGroup = row.getCell(1).text?.trim();
      const codeSequence = row.getCell(2).text?.trim();
      const name = row.getCell(3).text?.trim();
      const typeName = row.getCell(4).text?.trim();
      const unitName = row.getCell(5).text?.trim();
      const purchasePriceStr = row.getCell(6).text?.trim();
      const salePriceStr = row.getCell(7).text?.trim();
      const criticalLimitStr = row.getCell(8).text?.trim();
      const kdvStr = row.getCell(9).text?.trim();
      const currencyCode = row.getCell(10).text?.trim();
      const description = row.getCell(11).text?.trim();

      // Skip completely empty rows
      if (!codeGroup && !codeSequence && !name && !typeName && !unitName) {
        return;
      }

      // Convert price/numbers safely, supporting spaces and comma as decimal separator
      const parseNumber = (val: string, colName: string, rowNum: number) => {
        if (!val) return 0;
        const clean = val.replace(/\s/g, '').replace(/,/g, '.');
        try {
          const d = new Decimal(clean);
          if (d.isNaN()) throw new Error('NaN');
          return d.toDecimalPlaces(4).toNumber();
        } catch {
          errors.push(`Satır ${rowNum}: '${colName}' geçersiz sayı formatı içeriyor: '${val}'. Değer '0' olarak kabul edildi.`);
          return 0;
        }
      };

      const purchasePrice = parseNumber(purchasePriceStr, 'Alış Fiyatı', rowNumber);
      const salePrice = parseNumber(salePriceStr, 'Satış Fiyatı', rowNumber);
      const criticalLimit = parseNumber(criticalLimitStr, 'Kritik Limit', rowNumber);
      const kdv = kdvStr ? parseNumber(kdvStr, 'KDV', rowNumber) : 20;

      items.push({
        codeGroup: codeGroup || undefined,
        codeSequence: codeSequence || undefined,
        name: name || '',
        typeName: typeName || undefined,
        unitName: unitName || undefined,
        purchasePrice,
        salePrice,
        criticalLimit,
        kdv,
        currencyCode: currencyCode || undefined,
        description: description || undefined
      });
    });

    if (items.length === 0) {
      throw new BadRequestException('Excel dosyasında aktarılacak herhangi bir ürün satırı bulunamadı.');
    }

    const importResult = await this.importItems(items, userId);
    
    // Merge any row parsing errors with mapping/db errors
    importResult.errors = [...errors, ...importResult.errors];
    return importResult;
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
