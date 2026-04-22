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
  UpdateItemTypeDto,
  UpdateQuantityTypeDto,
  UpdateItemCodeGroupDto
} from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginatedResult } from '../../../common/dto/pagination.dto';
import { CurrenciesService } from '../../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { TransactionContextService } from '../../../common/services/transaction-context.service';
import { getSafeSearchPattern } from '../../../common/utils/sql.helper';

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
      .leftJoinAndSelect('item.itemType', 'itemType')
      .leftJoinAndSelect('item.itemCodeGroup', 'itemCodeGroup')
      .leftJoinAndSelect('item.quantityType', 'quantityType')
      .leftJoinAndSelect('item.provider', 'provider')
      .leftJoinAndSelect('item.currency', 'currency');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(item.name LIKE :s OR item.code LIKE :s OR item.code1 LIKE :s OR item.code2 LIKE :s OR item.description LIKE :s OR item.notes LIKE :s OR itemType.name LIKE :s OR provider.name LIKE :s)', { s });
    }

    if (query.itemTypeId) qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
    if (query.providerId) qb.andWhere('item.providerId = :providerId', { providerId: query.providerId });
    if (query.currencyId) qb.andWhere('item.currencyId = :currencyId', { currencyId: query.currencyId });
    if (query.state !== undefined) qb.andWhere('item.state = :state', { state: query.state });

    if (query.critical === 'true') {
      qb.andWhere('(SELECT COALESCE(SUM(quantity), 0) FROM stocks WHERE item_id = item.id) < item.criticalLimit');
      qb.andWhere('item.criticalLimit > 0');
    }

    const itemFilterMap: Record<string, string> = {
      name: 'item.name',
      code: 'item.code',
      code1: 'item.code1',
      code2: 'item.code2',
      description: 'item.description',
      notes: 'item.notes',
      barcode: 'item.barcode',
      taxRate: 'item.taxRate',
    };

    Object.keys(query).forEach(key => {
      const dbCol = itemFilterMap[key];
      const val = query[key as keyof typeof query];
      if (dbCol && val !== undefined) {
        const s = getSafeSearchPattern(val.toString());
        qb.andWhere(`${dbCol} LIKE :${key}`, { [key]: s });
      }
    });

    const sortFieldMap: Record<string, string> = {
      'name': 'item.name',
      'code': 'item.code',
      'purchasePrice': 'item.purchasePrice',
      'salePrice': 'item.salePrice',
      'criticalLimit': 'item.criticalLimit',
      'createdAt': 'item.createdAt',
      'itemType.name': 'itemType.name',
      'provider.name': 'provider.name',
      'state': 'item.state',
      'totalStock': '(SELECT COALESCE(SUM(quantity), 0) FROM stocks WHERE item_id = item.id)'
    };

    const sortCol = sortFieldMap[query.sortBy || ''] || 'item.createdAt';
    qb.orderBy(sortCol, query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
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
    const { Department } = await import('../../departments/entities/department.entity');
    const departments = await manager.find(Department, { where: { state: 1 } });
    
    for (const dept of departments) {
      await manager.save(manager.create(Stock, {
        itemId: savedItem.id,
        departmentId: dept.id,
        quantity: new Decimal(0),
        reservedQuantity: new Decimal(0),
        createdBy: userId
      }));
    }

    return savedItem;
  }

  async update(id: number, dto: UpdateItemDto, userId?: number): Promise<Item> {
    const item = await this.findOne(id);

    if (dto.code && dto.code !== item.code) {
      const existing = await this.itemRepo.findOne({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`'${dto.code}' kodlu bir ürün zaten mevcut.`);
      }
    }

    if (dto.name !== undefined) item.name = dto.name;
    if (dto.itemTypeId !== undefined) item.itemTypeId = dto.itemTypeId;
    if (dto.itemCodeGroupId !== undefined) item.itemCodeGroupId = dto.itemCodeGroupId;
    if (dto.code !== undefined) item.code = dto.code;
    if (dto.code1 !== undefined) item.code1 = dto.code1;
    if (dto.code2 !== undefined) item.code2 = dto.code2;
    if (dto.image !== undefined) item.image = dto.image;
    if (dto.currencyId !== undefined) item.currencyId = dto.currencyId;
    if (dto.quantityTypeId !== undefined) item.quantityTypeId = dto.quantityTypeId;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.notes !== undefined) item.notes = dto.notes;
    if (dto.providerId !== undefined) item.providerId = dto.providerId;

    if (dto.state !== undefined) {
      item.state = dto.state;
    }

    if (dto.criticalLimit !== undefined) item.criticalLimit = dto.criticalLimit;
    if (dto.purchasePrice !== undefined) item.purchasePrice = dto.purchasePrice;
    if (dto.salePrice !== undefined) item.salePrice = dto.salePrice;
    if (dto.netPrice !== undefined) item.netPrice = dto.netPrice;
    if (dto.kdv !== undefined) item.kdv = dto.kdv;

    item.updatedBy = userId || null;
    return this.itemRepo.save(item);
  }

  async softDelete(id: number, currentUserId?: number): Promise<void> {
    const item = await this.findOne(id);

    // SEC-03: Stock check before delete
    const totalQtyResult = await this.stockRepo.createQueryBuilder('stock')
      .where('stock.itemId = :id', { id })
      .select('SUM(stock.quantity)', 'total')
      .getRawOne();

    const totalQty = new Decimal(totalQtyResult?.total || 0);
    if (!totalQty.isZero()) {
      throw new BadRequestException(`Stokta ${totalQty.toString()} adet ürün bulunduğu için silinemez. Lütfen önce stokları sıfırlayınız.`);
    }

    // SEC-03: BOM usage check (BOMs are in production module, but we can check via BomItem)
    const { BomItem } = await import('../../production/entities/bom-item.entity');
    const bomUsage = await this.dataSource.getRepository(BomItem).count({ where: { itemId: id } });
    if (bomUsage > 0) {
      throw new BadRequestException(`Bu ürün ${bomUsage} adet üretim reçetesinde (BOM) kullanılmaktadır ve silinemez.`);
    }

    await this.itemRepo.update(id, {
      state: 0,
      updatedBy: currentUserId || null,
    });
    await this.itemRepo.softDelete(id);
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
