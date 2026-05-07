import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import * as ExcelJS from 'exceljs';

import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { ItemsQueryDto } from '../dto/inventory.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

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
      .select([
        'item.id', 'item.name', 'item.code', 'item.code1', 'item.code2',
        'item.purchasePrice', 'item.salePrice', 'item.totalStock',
        'item.criticalLimit', 'item.state', 'item.createdAt',
        'itemType.id', 'itemType.name',
        'quantityType.id', 'quantityType.abbreviation',
        'provider.id', 'provider.name',
        'currency.id', 'currency.symbol'
      ]);

    if (query.search) {
      qb.andWhere(
        '(item.name LIKE :s OR item.code LIKE :s OR item.code1 LIKE :s OR item.code2 LIKE :s OR item.description LIKE :s OR item.notes LIKE :s)',
        { s: `%${query.search}%` }
      );
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
}
