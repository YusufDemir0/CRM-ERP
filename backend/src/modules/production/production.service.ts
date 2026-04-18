import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { StocksService } from '../inventory/stocks/stocks.service';
import { ItemsService } from '../inventory/items/items.service';
import { LogsService } from '../logs/logs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import {
  CreateBomDto, UpdateBomDto,
  CreateProductionOrderDto, UpdateProductionOrderDto,
  BomQueryDto, ProductionOrderQueryDto,
} from './dto/production.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { FinanceHelper as FH } from '../../common/utils/finance.helper';
import { DateUtils } from '../../common/utils/date.utils';
import { Decimal } from 'decimal.js';
import { Transactional } from '../../common/decorators/transactional.decorator';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    @InjectRepository(Bom) private bomRepo: Repository<Bom>,
    @InjectRepository(BomItem) private bomItemRepo: Repository<BomItem>,
    @InjectRepository(ProductionOrder) private poRepo: Repository<ProductionOrder>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private stocksService: StocksService,
    private itemsService: ItemsService,
    private logsService: LogsService,
    private transactionContext: TransactionContextService,
  ) {}

  // ────── BOMs (ÜRETİM REÇETELERİ) ──────

  async findAllBoms(query: BomQueryDto): Promise<PaginatedResult<Bom>> {
    const qb = this.bomRepo.createQueryBuilder('bom')
      .leftJoinAndSelect('bom.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('bom.targetItem', 'targetItem');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(bom.name LIKE :s OR targetItem.name LIKE :s OR targetItem.code LIKE :s)', { s });
    }
    
    if (query.state !== undefined) {
      qb.andWhere('bom.state = :state', { state: query.state });
    }

    qb.orderBy('bom.createdAt', 'DESC').skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOneBom(id: number): Promise<Bom> {
    const bom = await this.bomRepo.findOne({
      where: { id },
      relations:['items', 'items.item', 'targetItem'],
    });
    if (!bom) throw new NotFoundException('Reçete (BOM) bulunamadı');
    return bom;
  }

  @Transactional()
  async createBom(dto: CreateBomDto, userId?: number): Promise<Bom> {
    const manager = this.transactionContext.manager;

    let version = 1;

    if (dto.targetItemId) {
      const lastBom = await manager.findOne(Bom, {
        where: { targetItemId: dto.targetItemId },
        order: { version: 'DESC' },
      });
      if (lastBom) version = lastBom.version + 1;

      await manager.update(Bom, { targetItemId: dto.targetItemId, isActive: true }, { isActive: false });
    }

    const bom = manager.create(Bom, {
      name: dto.name,
      description: dto.description || null,
      targetItemId: dto.targetItemId || null,
      version: version,
      isActive: true,
      createdBy: userId,
    });
    
    const savedBom = await manager.save(bom);
    
    const groupedItems = dto.items.reduce((acc, current) => {
      const existing = acc.find(i => i.itemId === current.itemId);
      if (existing) {
        existing.quantity = FH.add(existing.quantity, current.quantity);
      } else {
        acc.push({ itemId: current.itemId, quantity: new Decimal(current.quantity), description: current.description });
      }
      return acc;
    }, [] as Array<{ itemId: number; quantity: Decimal; description?: string }>);
    
    for (const itemDto of groupedItems) {
      const item = await manager.findOne(Item, { where: { id: itemDto.itemId } });
      if (!item || item.state !== 1) {
        throw new BadRequestException(`Ürün bulunamadı veya pasif durumda (ID: ${itemDto.itemId}). Reçeteye eklenemez.`);
      }

      const bomItem = manager.create(BomItem, {
        bomId: savedBom.id,
        itemId: itemDto.itemId,
        quantity: itemDto.quantity,
        description: itemDto.description || '',
        createdBy: userId,
      });
      await manager.save(bomItem);
    }

    return this.findOneBom(savedBom.id);
  }

  @Transactional()
  async updateBom(id: number, dto: UpdateBomDto, userId?: number): Promise<Bom> {
    const manager = this.transactionContext.manager;

    const bom = await manager.findOne(Bom, { where: { id } });
    if (!bom) throw new NotFoundException('Reçete (BOM) bulunamadı');

    if (dto.name !== undefined) bom.name = dto.name;
    if (dto.description !== undefined) bom.description = dto.description;
    if (dto.targetItemId !== undefined) bom.targetItemId = dto.targetItemId;
    if (dto.state !== undefined) bom.state = dto.state;
    bom.updatedBy = userId || null;
    
    await manager.save(bom);

    if (dto.items && dto.items.length > 0) {
      await manager.update(Bom, id, { isActive: false, updatedBy: userId });
      
      const lastVersion = bom.version;
      const newBom = manager.create(Bom, {
        name: dto.name ?? bom.name,
        description: dto.description ?? bom.description,
        targetItemId: dto.targetItemId ?? bom.targetItemId,
        version: lastVersion + 1,
        isActive: true,
        createdBy: userId,
      });
      const savedNew = await manager.save(newBom);
      
      for (const itemDto of dto.items) {
        await manager.save(manager.create(BomItem, {
          bomId: savedNew.id,
          itemId: itemDto.itemId,
          quantity: itemDto.quantity,
          createdBy: userId
        }));
      }
      
      return this.findOneBom(savedNew.id);
    }

    const finalSaved = await manager.save(bom);
    return this.findOneBom(finalSaved.id);
  }

  async deleteBom(id: number): Promise<void> {
    const bom = await this.findOneBom(id);
    
    const usageCount = await this.poRepo.count({ where: { bomId: id } });
    if (usageCount > 0) {
      throw new BadRequestException(`Bu reçete ${usageCount} adet üretim emrinde kullanılmaktadır ve silinemez. Arşivlemeyi deneyin.`);
    }

    await this.bomRepo.softDelete(id);
  }

  async countItemUsageInBoms(itemId: number): Promise<number> {
    return this.bomItemRepo.count({ where: { itemId } });
  }

  // ────── PRODUCTION ORDERS (ÜRETİM EMİRLERİ VE ONAYLARI) ──────

  async findAllOrders(query: ProductionOrderQueryDto): Promise<PaginatedResult<ProductionOrder>> {
    const qb = this.poRepo.createQueryBuilder('po')
      .leftJoinAndSelect('po.bom', 'bom')
      .leftJoinAndSelect('po.sourceDepartment', 'sourceDept')
      .leftJoinAndSelect('po.targetDepartment', 'targetDept');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.where('(po.code LIKE :s OR bom.name LIKE :s)', { s });
    }
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
      relations:['bom', 'bom.items', 'bom.items.item', 'sourceDepartment', 'targetDepartment'],
    });
    if (!po) throw new NotFoundException('Üretim emri bulunamadı');
    return po;
  }

  @Transactional()
  async createOrder(dto: CreateProductionOrderDto, userId?: number): Promise<ProductionOrder> {
    const manager = this.transactionContext.manager;

    const bom = await this.findOneBom(dto.bomId);
    if (!bom.isActive) {
      throw new BadRequestException('Sadece aktif (aktif versiyon) reçeteler ile üretim emri oluşturulabilir.');
    }

    const code = await this.sequenceGenerator.generateProductionCode(manager);

    const po = manager.create(ProductionOrder, {
      code,
      bomId: dto.bomId,
      plannedQuantity: new Decimal(dto.plannedQuantity || 0),
      producedQuantity: new Decimal(0),
      wastageQuantity: new Decimal(0),
      sourceDepartmentId: dto.sourceDepartmentId || null,
      targetDepartmentId: dto.targetDepartmentId || null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      notes: dto.notes,
      status: 'draft',
      createdBy: userId,
    });

    const saved = await manager.save(po);
    return this.findOneOrder(saved.id);
  }

  @Transactional()
  async updateOrder(id: number, dto: UpdateProductionOrderDto, userId?: number): Promise<ProductionOrder> {
    const manager = this.transactionContext.manager;
    const po = await this.findOneOrder(id);

    if (po.status === 'completed' || po.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya iptal edilmiş üretim emirleri üzerinde değişiklik yapılamaz.');
    }

    if (dto.status === 'completed') {
      const producedQty = new Decimal(dto.producedQuantity ?? po.producedQuantity);
      const sourceDeptId = dto.sourceDepartmentId ?? po.sourceDepartmentId;
      const targetDeptId = dto.targetDepartmentId ?? po.targetDepartmentId;

      if (new Decimal(producedQty).lte(0)) throw new BadRequestException('Üretilen miktar 0 (sıfır) olarak işlem tamamlanamaz.');
      if (!sourceDeptId) throw new BadRequestException('Hammadde stok düşümü (sarf) için kaynak depo seçimi zorunludur.');
      if (!targetDeptId) throw new BadRequestException('Üretilen ürünün stoğa girebilmesi için hedef depo seçimi zorunludur.');
      
      const lockedPo = await manager.findOne(ProductionOrder, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        relations: ['bom', 'bom.items', 'bom.items.item']
      });
      if (!lockedPo) throw new NotFoundException('İş emri kilitlenemedi veya bulunamadı.');
      if (lockedPo.status === 'completed') throw new BadRequestException('Bu iş emri bir başka işlem tarafından zaten tamamlanmış.');
      
      const targetItem = lockedPo.bom.targetItem;
      if (!targetItem) throw new BadRequestException('Bu reçetede (BOM) çıkacak ana ürün belirlenmediği için stoklara üretim girişi yapılamıyor!');

      let totalMaterialCost = new Decimal(0);
      const sortedBomItems = [...lockedPo.bom.items].sort((a, b) => a.itemId - b.itemId);

      for (const bomItem of sortedBomItems) {
        const requiredQty = FH.mul(bomItem.quantity, producedQty);
        const currentComponentMAC = new Decimal(bomItem.item?.movingAverageCost || bomItem.item?.purchasePrice || 0);
        const itemTotalCost = FH.mul(requiredQty, currentComponentMAC);
        totalMaterialCost = FH.add(totalMaterialCost, itemTotalCost);

        await this.stocksService.decreaseStock(
          bomItem.itemId,
          sourceDeptId,
          requiredQty,
          manager,
          { type: 'production', id: lockedPo.id, description: `Üretim Sarfiyat Çıkışı: İş Emri ${lockedPo.code}` },
          userId
        );
      }

      const laborCost = new Decimal(dto.laborCost ?? lockedPo.laborCost ?? 0);
      const overheadCost = new Decimal(dto.overheadCost ?? lockedPo.overheadCost ?? 0);
      const totalProductionCost = FH.add(FH.add(totalMaterialCost, laborCost), overheadCost);
      const unitCost = FH.div(totalProductionCost, producedQty, 4);

      await this.stocksService.increaseStock(
        targetItem.id,
        targetDeptId,
        producedQty,
        unitCost,
        manager,
        { type: 'production', id: lockedPo.id, description: `Üretim Mamül Girişi: İş Emri ${lockedPo.code}` },
        userId
      );

      await manager.update(ProductionOrder, lockedPo.id, {
        status: 'completed',
        producedQuantity: producedQty,
        wastageQuantity: dto.wastageQuantity ?? lockedPo.wastageQuantity,
        sourceDepartmentId: sourceDeptId,
        targetDepartmentId: targetDeptId,
        unitCost,
        totalCost: totalProductionCost,
        laborCost,
        overheadCost,
        endDate: dto.endDate ?? DateUtils.getToday(),
        notes: dto.notes ?? lockedPo.notes,
        updatedBy: userId
      });

      this.logsService.logActivity({
        userId,
        module: 'production',
        action: 'COMPLETE_PRODUCTION',
        tag: 'SUCCESS',
        details: `Üretim tamamlandı: ${lockedPo.code}, Ürün: ${targetItem.name}, Miktar: ${producedQty}`,
      });

      this.logger.log(`✅ İş Emri: ${lockedPo.code} başarıyla Tamamlandı.`);
      return this.findOneOrder(lockedPo.id);
    } 

    if (dto.plannedQuantity !== undefined) po.plannedQuantity = new Decimal(dto.plannedQuantity);
    if (dto.producedQuantity !== undefined) po.producedQuantity = new Decimal(dto.producedQuantity);
    if (dto.wastageQuantity !== undefined) po.wastageQuantity = new Decimal(dto.wastageQuantity);
    if (dto.sourceDepartmentId !== undefined) po.sourceDepartmentId = dto.sourceDepartmentId;
    if (dto.targetDepartmentId !== undefined) po.targetDepartmentId = dto.targetDepartmentId;
    if (dto.startDate !== undefined) po.startDate = dto.startDate;
    if (dto.endDate !== undefined) po.endDate = dto.endDate;
    if (dto.status !== undefined) po.status = dto.status as any;
    if (dto.laborCost !== undefined) po.laborCost = new Decimal(dto.laborCost);
    if (dto.overheadCost !== undefined) po.overheadCost = new Decimal(dto.overheadCost);
    if (dto.notes !== undefined) po.notes = dto.notes;
    
    po.updatedBy = userId || null;
    return this.poRepo.save(po);
  }

  async deleteOrder(id: number): Promise<void> {
    const po = await this.findOneOrder(id);
    if (po.status === 'completed' || po.status === 'in_progress') {
       throw new BadRequestException('Başlamış veya bitmiş üretim emirleri silinemez. İptal statüsünü deneyiniz.');
    }
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