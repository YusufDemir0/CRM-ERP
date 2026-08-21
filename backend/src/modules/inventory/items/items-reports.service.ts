import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import * as ExcelJS from 'exceljs';

import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { Currency } from '../../finance/currencies/entities/currency.entity';
import { ItemsQueryDto } from '../dto/inventory.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';

@Injectable()
export class ItemsReportsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(ItemType) private itemTypeRepo: Repository<ItemType>,
    @InjectRepository(QuantityType) private qtyTypeRepo: Repository<QuantityType>,
    @InjectRepository(ItemCodeGroup) private codeGroupRepo: Repository<ItemCodeGroup>,
  ) {}

  async findAll(query: ItemsQueryDto): Promise<PaginatedResult<Item>> {
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoin('item.itemType', 'itemType')
      .leftJoin('item.quantityType', 'quantityType')
      .leftJoin('item.provider', 'provider')
      .leftJoin('item.currency', 'currency')
      .leftJoin('item.itemCodeGroup', 'itemCodeGroup')
      .leftJoin('item.stocks', 'stocks')
      .leftJoin('stocks.department', 'stockDepartment')
      .select([
        'item.id', 'item.name', 'item.code', 'item.code1', 'item.code2',
        'item.purchasePrice', 'item.salePrice', 'item.totalStock',
        'item.criticalLimit', 'item.state', 'item.createdAt', 'item.kdv', 'item.description',
        'itemType.id', 'itemType.name',
        'quantityType.id', 'quantityType.abbreviation',
        'provider.id', 'provider.name',
        'currency.id', 'currency.symbol', 'currency.code',
        'itemCodeGroup.id', 'itemCodeGroup.prefix', 'itemCodeGroup.name',
        'stocks.id', 'stocks.quantity', 'stocks.reservedQuantity', 'stocks.departmentId',
        'stockDepartment.id', 'stockDepartment.name', 'stockDepartment.abbreviation'
      ]);

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      if (s) {
        qb.andWhere(
          '(item.name LIKE :s OR item.code LIKE :s OR item.code1 LIKE :s OR item.code2 LIKE :s OR item.description LIKE :s OR item.notes LIKE :s)',
          { s }
        );
      }
    }

    if (query.itemTypeId) qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
    if (query.providerId) qb.andWhere('item.providerId = :providerId', { providerId: query.providerId });
    if (query.currencyId) qb.andWhere('item.currencyId = :currencyId', { currencyId: query.currencyId });
    if (query.state !== undefined) qb.andWhere('item.state = :state', { state: query.state });

    if (query.critical === 'true') {
      qb.andWhere('item.totalStock < item.criticalLimit AND item.criticalLimit > 0');
    }

    const sortFieldMap: Record<string, string> = {
      'name': 'item.name',
      'code': 'item.code',
      'purchasePrice': 'item.purchasePrice',
      'totalStock': 'item.totalStock',
      'createdAt': 'item.createdAt'
    };

    const sortCol = sortFieldMap[query.sortBy || ''] || 'item.createdAt';
    qb.orderBy(sortCol, query.sortOrderSafe);
    
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

  async findOne(id: string, manager?: EntityManager): Promise<Item> {
    const repo = manager ? manager.getRepository(Item) : this.itemRepo;
    const item = await repo.findOne({
      where: { id: String(id) },
      relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
    });
    if (!item) throw new NotFoundException('Ürün bulunamadı');
    return item;
  }

  async findAllItemTypes(): Promise<ItemType[]> {
    return this.itemTypeRepo.find();
  }

  async findAllItemCodeGroups(): Promise<ItemCodeGroup[]> {
    return this.codeGroupRepo.find();
  }

  async findAllQuantityTypes(): Promise<QuantityType[]> {
    return this.qtyTypeRepo.find();
  }

  async getStatus() {
    const [active, passive, lowStock] = await Promise.all([
      this.itemRepo.count({ where: { state: 1 } }),
      this.itemRepo.count({ where: { state: 0 } }),
      this.itemRepo.createQueryBuilder('item').where('item.state = 1 AND item.criticalLimit > 0').getCount(),
    ]);
    return { active, passive, total: active + passive, lowStock };
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

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }

  async getImportTemplate(): Promise<StreamableFile> {
    const [codeGroups, currencies, itemTypes, quantityTypes, { data: items }] = await Promise.all([
      this.findAllItemCodeGroups(),
      this.itemTypeRepo.manager.find(Currency, { where: { state: 1 } }),
      this.findAllItemTypes(),
      this.findAllQuantityTypes(),
      this.findAll({ limit: 10000 } as ItemsQueryDto)
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ürün Toplu Aktarım');

    // Define column structures
    worksheet.columns = [
      { header: 'Kod Grubu', key: 'codeGroup', width: 15 },
      { header: 'Kod Sekansı', key: 'codeSequence', width: 15 },
      { header: 'Ürün Adı', key: 'name', width: 35 },
      { header: 'Ürün Tipi', key: 'typeName', width: 20 },
      { header: 'Birim', key: 'unitName', width: 15 },
      { header: 'Alış Fiyatı', key: 'purchasePrice', width: 15 },
      { header: 'Satış Fiyatı', key: 'salePrice', width: 15 },
      { header: 'Kritik Limit', key: 'criticalLimit', width: 15 },
      { header: 'KDV', key: 'kdv', width: 10 },
      { header: 'Para Birimi', key: 'currencyCode', width: 15 },
      { header: 'Açıklama', key: 'description', width: 35 },
      { header: '', key: 'spacer', width: 5 }, // Column L
      { header: 'REFERANS KOD GRUPLARI', key: 'refCodeGroups', width: 30 }, // Column M
      { header: 'REFERANS PARA BİRİMLERİ', key: 'refCurrencies', width: 30 }, // Column N
      { header: 'REFERANS ÜRÜN TİPLERİ', key: 'refItemTypes', width: 30 }, // Column O
      { header: 'REFERANS BİRİM TÜRLERİ', key: 'refQuantityTypes', width: 30 } // Column P
    ];

    // Build rowsData from existing items
    const rowsData = items.map(item => {
      const prefix = item.itemCodeGroup?.prefix || "";
      let sequence = "";
      let codeGroup = "";
      
      if (prefix) {
        codeGroup = prefix;
        if (item.code.startsWith(prefix)) {
          const rest = item.code.substring(prefix.length);
          sequence = rest.startsWith("-") ? rest.substring(1) : rest;
        } else {
          sequence = item.code;
        }
      } else {
        const dashIdx = item.code.indexOf("-");
        if (dashIdx !== -1) {
          codeGroup = item.code.substring(0, dashIdx);
          sequence = item.code.substring(dashIdx + 1);
        } else {
          codeGroup = "";
          sequence = item.code;
        }
      }

      return {
        codeGroup,
        codeSequence: sequence,
        name: item.name,
        typeName: item.itemType?.name || "",
        unitName: item.quantityType?.abbreviation || "",
        purchasePrice: item.purchasePrice !== null && item.purchasePrice !== undefined ? Number(item.purchasePrice) : 0,
        salePrice: item.salePrice !== null && item.salePrice !== undefined ? Number(item.salePrice) : 0,
        criticalLimit: item.criticalLimit !== null && item.criticalLimit !== undefined ? Number(item.criticalLimit) : 0,
        kdv: item.kdv !== null && item.kdv !== undefined ? Number(item.kdv) : 20,
        currencyCode: item.currency?.code || "TRY",
        description: item.description || ""
      };
    });

    // If there are no items, write at least one example row so the sheet isn't completely empty
    if (rowsData.length === 0) {
      rowsData.push({
        codeGroup: "MAM",
        codeSequence: "",
        name: "Örnek Yeni Ürün",
        typeName: "MAMÜL",
        unitName: "ADET",
        purchasePrice: 150.00,
        salePrice: 250.00,
        criticalLimit: 10,
        kdv: 20,
        currencyCode: "TRY",
        description: "Yeni üretilecek ürün"
      });
    }

    const maxRows = Math.max(rowsData.length, codeGroups.length, currencies.length, itemTypes.length, quantityTypes.length);

    for (let i = 0; i < maxRows; i++) {
      const rowData: Record<string, unknown> = {};

      // 1. Add active columns (A-K)
      if (i < rowsData.length) {
        Object.assign(rowData, rowsData[i]);
      } else {
        Object.assign(rowData, {
          codeGroup: "",
          codeSequence: "",
          name: "",
          typeName: "",
          unitName: "",
          purchasePrice: "",
          salePrice: "",
          criticalLimit: "",
          kdv: "",
          currencyCode: "",
          description: ""
        });
      }

      // 2. Add separator (L)
      rowData.spacer = "";

      // 3. Add Code Groups Reference (M)
      if (i < codeGroups.length) {
        const cg = codeGroups[i];
        rowData.refCodeGroups = `${cg.prefix} - ${cg.name}`;
      } else {
        rowData.refCodeGroups = "";
      }

      // 4. Add Currencies Reference (N)
      if (i < currencies.length) {
        const cur = currencies[i];
        rowData.refCurrencies = `${cur.code} - ${cur.name || ''}`;
      } else {
        rowData.refCurrencies = "";
      }

      // 5. Add Item Types Reference (O)
      if (i < itemTypes.length) {
        const it = itemTypes[i];
        rowData.refItemTypes = it.name;
      } else {
        rowData.refItemTypes = "";
      }

      // 6. Add Quantity Types Reference (P)
      if (i < quantityTypes.length) {
        const qt = quantityTypes[i];
        rowData.refQuantityTypes = `${qt.abbreviation} - ${qt.name}`;
      } else {
        rowData.refQuantityTypes = "";
      }

      worksheet.addRow(rowData);
    }

    // Styling the headers beautifully
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Active headers A-K: Dark Navy Blue Background
    for (let col = 1; col <= 11; col++) {
      headerRow.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C3E50' }
      };
    }

    // Spacer column L: No background
    headerRow.getCell(12).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' }
    };

    // Reference headers M-P: elegant Teal Background
    for (let col = 13; col <= 16; col++) {
      headerRow.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A085' }
      };
    }

    // Auto-adjust grid lines
    worksheet.views = [{ showGridLines: true }];

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }
}
