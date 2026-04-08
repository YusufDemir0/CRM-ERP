import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { ItemCodeGroup } from './entities/item-code-group.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto, CreateItemCodeGroupDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(ItemType) private itemTypeRepo: Repository<ItemType>,
    @InjectRepository(QuantityType) private qtyTypeRepo: Repository<QuantityType>,
    @InjectRepository(ItemCodeGroup) private codeGroupRepo: Repository<ItemCodeGroup>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  // ────── ITEMS ──────

  async findAll(query: PaginationDto & { itemTypeId?: number }): Promise<PaginatedResult<Item>> {
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.itemType', 'itemType')
      .leftJoinAndSelect('item.itemCodeGroup', 'itemCodeGroup')
      .leftJoinAndSelect('item.quantityType', 'quantityType')
      .leftJoinAndSelect('item.provider', 'provider')
      .leftJoinAndSelect('item.currency', 'currency');

    if (query.search) {
      qb.where('(item.name LIKE :s OR item.code LIKE :s OR item.description LIKE :s OR itemType.name LIKE :s OR provider.name LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.itemTypeId) {
      qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
    }
    if (query.state !== undefined) {
      qb.andWhere('item.state = :state', { state: query.state });
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
      const code = await this.sequenceGenerator.generateItemCode(queryRunner, dto.itemCodeGroupId);

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
    Object.assign(item, dto);
    item.updatedBy = userId || null;
    return this.itemRepo.save(item);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);
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

    Object.assign(type, dto);
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

    Object.assign(group, dto);
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

  async getStatus() {
    const [active, passive, lowStock] = await Promise.all([
      this.itemRepo.count({ where: { state: 1 } }),
      this.itemRepo.count({ where: { state: 0 } }),
      this.itemRepo.count({ where: { state: 1, criticalLimit: MoreThan(0) } }),
    ]);
    return { active, passive, total: active + passive, lowStock };
  }
}
