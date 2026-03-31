import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemType } from './entities/item-type.entity';
import { QuantityType } from './entities/quantity-type.entity';
import { CreateItemDto, UpdateItemDto, CreateItemTypeDto, CreateQuantityTypeDto } from '../dto/inventory.dto';
import { SequenceGeneratorService } from '../../../common/services/sequence-generator.service';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(ItemType) private itemTypeRepo: Repository<ItemType>,
    @InjectRepository(QuantityType) private qtyTypeRepo: Repository<QuantityType>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  // ────── ITEMS ──────

  async findAll(query: PaginationDto & { itemTypeId?: number }): Promise<PaginatedResult<Item>> {
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.itemType', 'itemType')
      .leftJoinAndSelect('item.quantityType', 'quantityType')
      .leftJoinAndSelect('item.provider', 'provider')
      .leftJoinAndSelect('item.currency', 'currency');

    if (query.search) {
      qb.where('(item.name LIKE :s OR item.code LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.itemTypeId) {
      qb.andWhere('item.itemTypeId = :typeId', { typeId: query.itemTypeId });
    }

    qb.orderBy(`item.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
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
      relations: ['itemType', 'quantityType', 'provider', 'currency'],
    });
    if (!item) throw new NotFoundException('Ürün bulunamadı');
    return item;
  }

  /**
   * Ürün oluşturma — SequenceGenerator ile otomatik kod üretimi
   * Transaction içinde çalışır (pessimistic lock)
   */
  async create(dto: CreateItemDto, userId?: number): Promise<Item> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Pessimistic lock ile kod üret
      const code = await this.sequenceGenerator.generateItemCode(queryRunner, dto.itemTypeId);

      // 2. Item oluştur
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

  // ────── QUANTITY TYPES ──────

  async findAllQuantityTypes(): Promise<QuantityType[]> {
    return this.qtyTypeRepo.find();
  }

  async createQuantityType(dto: CreateQuantityTypeDto, userId?: number): Promise<QuantityType> {
    const type = this.qtyTypeRepo.create({ ...dto, createdBy: userId });
    return this.qtyTypeRepo.save(type);
  }
}
