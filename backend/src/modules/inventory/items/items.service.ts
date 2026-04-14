import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto, ItemsQueryDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { CurrenciesService } from '../../finance/currencies/currencies.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(ItemType) private itemTypeRepo: Repository<ItemType>,
    @InjectRepository(QuantityType) private qtyTypeRepo: Repository<QuantityType>,
    @InjectRepository(ItemCodeGroup) private codeGroupRepo: Repository<ItemCodeGroup>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private currenciesService: CurrenciesService,
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
      qb.andWhere('(item.name LIKE :s OR item.code LIKE :s OR item.code1 LIKE :s OR item.code2 LIKE :s OR item.description LIKE :s OR item.notes LIKE :s OR itemType.name LIKE :s OR provider.name LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.itemTypeId) {
      qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
    }
    if (query.state !== undefined) {
      qb.andWhere('item.state = :state', { state: query.state });
    }
    if (query.critical === 'true') {
      qb.andWhere('(SELECT COALESCE(SUM(quantity), 0) FROM stocks WHERE item_id = item.id) < item.criticalLimit');
      qb.andWhere('item.criticalLimit > 0');
    }

    // Validate sortBy against allowed columns to prevent SQL injection
    const allowedSortCols = ['createdAt', 'name', 'code', 'purchasePrice', 'salePrice', 'criticalLimit'];
    const sortCol = allowedSortCols.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
    qb.orderBy(`item.${sortCol}`, query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['itemType', 'itemCodeGroup', 'quantityType', 'provider', 'currency'],
    });
    if (!item) throw new NotFoundException('Ürün bulunamadı');
    return item;
  }

  async create(dto: CreateItemDto, userId?: number): Promise<Item> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!dto.currencyId) {
        try {
          const defaultCurrency = await this.currenciesService.getDefault();
          dto.currencyId = Number(defaultCurrency.id);
        } catch (error) {
          console.warn('Default currency not found in ItemsService, setting to null');
        }
      }

      // DB-05: App-level Unique Check (Code)
      // Sequence generator zaten uniq üretiyor ama manuel kod desteği için kontrol şart.
      const code = await this.sequenceGenerator.generateItemCode(queryRunner, dto.itemCodeGroupId);
      
      const existing = await queryRunner.manager.findOne(Item, { where: { code } });
      if (existing) {
        throw new BadRequestException(`'${code}' kodlu bir ürün zaten mevcut.`);
      }

      const item = queryRunner.manager.create(Item, {
        ...dto,
        code,
        createdBy: userId,
      });

      const savedItem = await queryRunner.manager.save(item);
      await queryRunner.commitTransaction();
      return savedItem;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateItemDto, userId?: number): Promise<Item> {
    const item = await this.findOne(id);

    // DB-05: Uniqueness Check for Update
    if (dto.code && dto.code !== item.code) {
      const existing = await this.itemRepo.findOne({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`'${dto.code}' kodlu bir ürün zaten mevcut.`);
      }
    }

    // Modernize mapping with strict field control
    const fields = [
      'name', 'itemTypeId', 'itemCodeGroupId', 'code', 'code1', 'code2',
      'image', 'currencyId', 'quantityTypeId', 'description', 'notes',
      'providerId', 'state'
    ];

    fields.forEach((field: any) => {
      if (dto[field as keyof UpdateItemDto] !== undefined) {
        (item as any)[field] = dto[field as keyof UpdateItemDto];
      }
    });

    // Explicit Decimal fields
    const decimalFields = ['criticalLimit', 'purchasePrice', 'salePrice', 'netPrice', 'kdv'];
    decimalFields.forEach((field: any) => {
      if (dto[field as keyof UpdateItemDto] !== undefined) {
        (item as any)[field] = new Decimal(dto[field as keyof UpdateItemDto] as any);
      }
    });

    item.updatedBy = userId || null;
    return this.itemRepo.save(item);
  }

  async softDelete(id: number): Promise<void> {
    const item = await this.findOne(id);
    
    // DB-04: Stok varsa silmeyi engelle
    const Stock = (await import('../stocks/entities/stock.entity')).Stock;
    const totalStock = await this.dataSource.getRepository(Stock).createQueryBuilder('stock')
      .where('stock.itemId = :id', { id })
      .select('SUM(stock.quantity)', 'sum')
      .getRawOne();
    
    if (totalStock && totalStock.sum && new Decimal(totalStock.sum).gt(0)) {
      throw new BadRequestException(`Stokta ${totalStock.sum} adet bulunan ürün silinemez. Lütfen önce stokları sıfırlayınız.`);
    }

    // Reçete (BOM) kullanımı kontrolü
    const BomItem = (await import('../../production/entities/bom-item.entity')).BomItem;
    const usageCount = await this.dataSource.getRepository(BomItem).count({ where: { itemId: id } });
    if (usageCount > 0) {
      throw new BadRequestException(`Bu ürün ${usageCount} farklı reçetede (BOM) kullanılmaktadır. Önce reçetelerden çıkarılmalıdır.`);
    }

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

  async updateItemType(id: number, dto: Partial<ItemType>, userId?: number): Promise<ItemType> {
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

  async updateItemCodeGroup(id: number, dto: Partial<ItemCodeGroup>, userId?: number): Promise<ItemCodeGroup> {
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

  async updateQuantityType(id: number, dto: Partial<QuantityType>, userId?: number): Promise<QuantityType> {
    const type = await this.qtyTypeRepo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Birim bulunamadı');

    // If deactivating, check if items use it
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
      this.itemRepo.count({ where: { state: 1, criticalLimit: MoreThan(0) } }),
    ]);
    return { active, passive, total: active + passive, lowStock };
  }
}
