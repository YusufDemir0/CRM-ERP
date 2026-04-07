import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import {
  CreateBomDto, UpdateBomDto,
  CreateProductionOrderDto, UpdateProductionOrderDto,
} from './dto/production.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Item } from '../inventory/items/entities/item.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(Bom) private bomRepo: Repository<Bom>,
    @InjectRepository(BomItem) private bomItemRepo: Repository<BomItem>,
    @InjectRepository(ProductionOrder) private poRepo: Repository<ProductionOrder>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  // ────── BOMs ──────

  async findAllBoms(query: PaginationDto): Promise<PaginatedResult<Bom>> {
    const qb = this.bomRepo.createQueryBuilder('bom')
      .leftJoinAndSelect('bom.items', 'items')
      .leftJoinAndSelect('items.item', 'item');

    if (query.search) qb.where('bom.name LIKE :s', { s: `%${query.search}%` });

    qb.orderBy('bom.name', 'ASC').skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOneBom(id: number): Promise<Bom> {
    const bom = await this.bomRepo.findOne({
      where: { id },
      relations: ['items', 'items.item'],
    });
    if (!bom) throw new NotFoundException('BOM bulunamadı');
    return bom;
  }

  async createBom(dto: CreateBomDto, userId?: number): Promise<Bom> {
    const bom = new Bom();
    bom.name = dto.name;
    bom.description = dto.description || null;
    bom.createdBy = userId ?? null;
    const savedBom = await this.bomRepo.save(bom);

    for (const itemDto of dto.items) {
      const item = await this.itemRepo.findOne({ where: { id: itemDto.itemId } });
      if (!item || item.state !== 1) {
        throw new BadRequestException(`Ürün '${item?.name || 'Bilinmeyen'}' pasif (arşivlenmiş) olduğundan reçeteye eklenemez.`);
      }

      const bomItem = this.bomItemRepo.create({
        bomId: savedBom.id,
        itemId: itemDto.itemId,
        quantity: itemDto.quantity,
        description: itemDto.description,
        createdBy: userId,
      });
      await this.bomItemRepo.save(bomItem);
    }

    return this.findOneBom(savedBom.id);
  }

  async updateBom(id: number, dto: UpdateBomDto, userId?: number): Promise<Bom> {
    const bom = await this.findOneBom(id);
    Object.assign(bom, dto);
    bom.updatedBy = userId || null;
    return this.bomRepo.save(bom);
  }

  async deleteBom(id: number): Promise<void> {
    await this.findOneBom(id);
    await this.bomRepo.softDelete(id);
  }

  // ────── PRODUCTION ORDERS ──────

  async findAllOrders(query: PaginationDto & { status?: string }): Promise<PaginatedResult<ProductionOrder>> {
    const qb = this.poRepo.createQueryBuilder('po')
      .leftJoinAndSelect('po.bom', 'bom');

    if (query.search) qb.where('(po.code LIKE :s OR bom.name LIKE :s)', { s: `%${query.search}%` });
    if (query.status) qb.andWhere('po.status = :status', { status: query.status });

    qb.orderBy('po.createdAt', 'DESC').skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOneOrder(id: number): Promise<ProductionOrder> {
    const po = await this.poRepo.findOne({
      where: { id },
      relations: ['bom', 'bom.items', 'bom.items.item'],
    });
    if (!po) throw new NotFoundException('Üretim emri bulunamadı');
    return po;
  }

  /**
   * Üretim emri oluşturma — Pessimistic lock ile kod üretimi
   */
  async createOrder(dto: CreateProductionOrderDto, userId?: number): Promise<ProductionOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const code = await this.sequenceGenerator.generateProductionCode(queryRunner);

      const po = queryRunner.manager.create(ProductionOrder, {
        code,
        bomId: dto.bomId,
        plannedQuantity: dto.plannedQuantity,
        startDate: dto.startDate,
        endDate: dto.endDate,
        notes: dto.notes,
        status: 'draft',
        createdBy: userId,
      });

      const saved = await queryRunner.manager.save(po);
      await queryRunner.commitTransaction();
      return this.findOneOrder(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateOrder(id: number, dto: UpdateProductionOrderDto, userId?: number): Promise<ProductionOrder> {
    const po = await this.findOneOrder(id);
    Object.assign(po, dto);
    po.updatedBy = userId || null;
    return this.poRepo.save(po);
  }

  async deleteOrder(id: number): Promise<void> {
    await this.findOneOrder(id);
    await this.poRepo.softDelete(id);
  }

  async getStatus() {
    const [draft, planned, inProgress, completed] = await Promise.all([
      this.poRepo.count({ where: { status: 'draft' } }),
      this.poRepo.count({ where: { status: 'planned' } }),
      this.poRepo.count({ where: { status: 'in_progress' } }),
      this.poRepo.count({ where: { status: 'completed' } }),
    ]);
    return { draft, planned, inProgress, completed, total: draft + planned + inProgress + completed };
  }
}
