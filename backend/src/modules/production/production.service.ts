import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { StocksService } from '../inventory/stocks/stocks.service';
import { ItemsService } from '../inventory/items/items.service';
import { LogsService } from '../logs/logs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
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
import { Transactional } from '@nestjs-cls/transactional';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { getSafeSearchPattern } from '../../common/utils/sql.helper';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

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
      .leftJoin('bom.targetItem', 'targetItem')
      .select([
        'bom.id', 'bom.name', 'bom.version', 'bom.isActive', 'bom.state', 'bom.createdAt', 'bom.description',
        'targetItem.id', 'targetItem.name', 'targetItem.code'
      ])
      .loadRelationCountAndMap('bom.itemCount', 'bom.items');

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(bom.name LIKE :s OR targetItem.name LIKE :s OR targetItem.code LIKE :s)', { s });
    }
    
    if (query.state !== undefined) {
      qb.andWhere('bom.state = :state', { state: query.state });
    }

    const sortFieldMap: Record<string, string> = {
      'name': 'bom.name',
      'createdAt': 'bom.createdAt',
      'version': 'bom.version'
    };

    const sortCol = sortFieldMap[query.sortBy || ''] || 'bom.createdAt';
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

  async findOneBom(id: string): Promise<Bom> {
    const bom = await this.transactionContext.manager.findOne(Bom, {
      where: { id },
      relations:['items', 'items.item', 'targetItem'],
    });
    if (!bom) throw new NotFoundException('Reçete (BOM) bulunamadı');
    return bom;
  }

  @Transactional()
  async createBom(dto: CreateBomDto, userId: string): Promise<Bom> {
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

    // Validate items and check for cycles BEFORE saving
    const materialItemIds: string[] = [];
    
    if (dto.items.length > 0) {
      const itemIdsToFetch = dto.items.map(i => i.itemId);
      const items = await manager.find(Item, { where: { id: In(itemIdsToFetch) } });
      const itemMap = new Map(items.map(i => [i.id, i]));

      for (const itemDto of dto.items) {
        if (dto.targetItemId && String(itemDto.itemId) === String(dto.targetItemId)) {
          throw new BadRequestException('Üretilecek ürünün kendisi, reçete içeriğinde yer alamaz!');
        }

        const item = itemMap.get(itemDto.itemId);
        if (!item || item.state !== 1) {
          throw new BadRequestException(`Ürün bulunamadı veya pasif (ID: ${itemDto.itemId}).`);
        }
        materialItemIds.push(itemDto.itemId);
      }
    }

    // BOM Cycle Detection — prevent A→B→C→A infinite loops
    if (dto.targetItemId) {
      const hasCycle = await this.detectBomCycle(dto.targetItemId, materialItemIds, manager);
      if (hasCycle) {
        throw new BadRequestException(
          'Döngüsel reçete tespit edildi! Malzemelerden biri doğrudan veya dolaylı olarak üretilecek ürüne bağlı.'
        );
      }
    }

    const bom = manager.create(Bom, {
      name: dto.name,
      description: dto.description ?? undefined,
      targetItemId: dto.targetItemId ?? undefined,
      version,
      isActive: true,
      createdBy: userId,
    });
    
    const savedBom = await manager.save(bom);
    
    const bomItemsToCreate = dto.items.map(itemDto => manager.create(BomItem, {
      bomId: savedBom.id,
      itemId: itemDto.itemId,
      quantity: new Decimal(itemDto.quantity),
      description: itemDto.description ?? '',
      createdBy: userId,
    }));

    if (bomItemsToCreate.length > 0) {
      await manager.save(BomItem, bomItemsToCreate);
    }

    return this.findOneBom(savedBom.id);
  }

  /**
   * DFS-based cycle detection for Bill of Materials.
   * 
   * Traverses the BOM graph starting from material items to check if any path
   * leads back to the targetItemId. This prevents infinite loops like A→B→C→A
   * where producing A requires C which requires A.
   * 
   * Performance: O(V+E) where V = unique items, E = BOM relationships.
   * For typical manufacturing BOMs (< 1000 items), this runs in < 10ms.
   */
  private async detectBomCycle(
    targetItemId: string, 
    materialItemIds: string[], 
    manager: import('typeorm').EntityManager
  ): Promise<boolean> {
    // SEC-01: Optimization — Load ALL active BOMs into memory once
    const allActiveBoms = await manager.find(Bom, {
      where: { isActive: true },
      relations: ['items'],
    });

    // Create a map for O(1) lookup: TargetItem ID -> List of Material Item IDs
    const bomMap = new Map<string, string[]>();
    for (const bom of allActiveBoms) {
      if (bom.targetItemId) {
        const materialIds = (bom.items || []).map(bi => bi.itemId);
        bomMap.set(String(bom.targetItemId), materialIds);
      }
    }

    const visited = new Set<string>();
    const stack = [...materialItemIds];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (String(currentId) === String(targetItemId)) return true; // CYCLE DETECTED
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Get children from memory map instead of database
      const children = bomMap.get(currentId) || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          stack.push(childId);
        }
      }
    }

    return false;
  }

  @Transactional()
  async updateBom(id: string, dto: UpdateBomDto, userId: string): Promise<Bom> {
    const manager = this.transactionContext.manager;
    const bom = await this.findOneBom(id);

    if (dto.name !== undefined) bom.name = dto.name;
    if (dto.description !== undefined) bom.description = dto.description;
    if (dto.targetItemId !== undefined) bom.targetItemId = dto.targetItemId;
    if (dto.state !== undefined) bom.state = dto.state;
    bom.updatedBy = userId || null;

    // If items are provided, replace them in-place (delete old + insert new)
    if (dto.items && dto.items.length > 0) {
      // Remove existing items
      await manager.delete(BomItem, { bomId: id });

      // Insert new items
      const newItems = dto.items.map((item) =>
        manager.create(BomItem, {
          bomId: id,
          itemId: item.itemId,
          quantity: item.quantity,
          description: item.description || '',
        })
      );
      await manager.save(newItems);
    }

    await manager.save(bom);
    return this.findOneBom(id);
  }

  async deleteBom(id: string): Promise<void> {
    const poCount = await this.poRepo.count({ where: { bomId: id } });
    if (poCount > 0) {
      throw new BadRequestException(`Bu reçete ${poCount} adet üretim emrinde kullanılmaktadır.`);
    }
    await this.bomRepo.softDelete(id);
  }

  // ────── PRODUCTION ORDERS ──────

  async findAllOrders(query: ProductionOrderQueryDto, currentUser?: JwtPayload): Promise<PaginatedResult<ProductionOrder>> {
    const qb = this.poRepo.createQueryBuilder('po')
      .leftJoin('po.bom', 'bom')
      .leftJoin('po.sourceDepartment', 'sourceDept')
      .leftJoin('po.targetDepartment', 'targetDept')
      .select([
        'po.id', 'po.code', 'po.plannedQuantity', 'po.producedQuantity', 
        'po.status', 'po.startDate', 'po.endDate', 'po.createdAt',
        'bom.id', 'bom.name',
        'sourceDept.id', 'sourceDept.name',
        'targetDept.id', 'targetDept.name'
      ]);

    const hasViewAll = currentUser?.isSystemAdmin || 
                       currentUser?.permissions?.includes('PRODUCTION_VIEW_ALL');
    
    if (!hasViewAll) {
      const hasViewDept = currentUser?.permissions?.includes('PRODUCTION_VIEW_DEPT');
      if (hasViewDept && currentUser?.departmentId) {
        qb.andWhere(
          '(po.sourceDepartmentId = :deptId OR po.targetDepartmentId = :deptId)',
          { deptId: String(currentUser.departmentId) }
        );
      } else {
        qb.andWhere('po.createdBy = :userId', { userId: String(currentUser?.sub) });
      }
    }

    if (query.search) {
      const s = getSafeSearchPattern(query.search);
      qb.andWhere('(po.code LIKE :s OR bom.name LIKE :s)', { s });
    }
    if (query.status) qb.andWhere('po.status = :status', { status: query.status });

    const sortFieldMap: Record<string, string> = {
      'code': 'po.code',
      'status': 'po.status',
      'plannedQuantity': 'po.plannedQuantity',
      'createdAt': 'po.createdAt'
    };

    const sortCol = sortFieldMap[query.sortBy || ''] || 'po.createdAt';
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

  async findOneOrder(id: string, currentUser?: JwtPayload): Promise<ProductionOrder> {
    const po = await this.transactionContext.manager.findOne(ProductionOrder, {
      where: { id },
      relations:['bom', 'bom.items', 'bom.items.item', 'sourceDepartment', 'targetDepartment'],
    });
    if (!po) throw new NotFoundException('Üretim emri bulunamadı');

    const hasViewAll = currentUser?.isSystemAdmin || 
                       currentUser?.permissions?.includes('PRODUCTION_VIEW_ALL');
    if (!hasViewAll) {
      const hasViewDept = currentUser?.permissions?.includes('PRODUCTION_VIEW_DEPT');
      if (hasViewDept && currentUser?.departmentId) {
        const isDeptRelated = String(po.sourceDepartmentId) === String(currentUser.departmentId) || 
                              String(po.targetDepartmentId) === String(currentUser.departmentId);
        if (!isDeptRelated) {
          throw new ForbiddenException('Bu üretim emrini görüntüleme yetkiniz bulunmamaktadır.');
        }
      } else {
        if (String(po.createdBy) !== String(currentUser?.sub)) {
          throw new ForbiddenException('Bu üretim emrini görüntüleme yetkiniz bulunmamaktadır.');
        }
      }
    }
    return po;
  }

  @Transactional()
  async createOrder(dto: CreateProductionOrderDto, userId: string): Promise<ProductionOrder> {
    const manager = this.transactionContext.manager;
    const bom = await this.findOneBom(dto.bomId);
    if (!bom.isActive) throw new BadRequestException('Sadece aktif reçeteler kullanılabilir.');

    const code = await this.sequenceGenerator.generateProductionCode(manager);
    const po = manager.create(ProductionOrder, {
      code,
      bomId: dto.bomId,
      plannedQuantity: new Decimal(dto.plannedQuantity),
      producedQuantity: new Decimal(dto.producedQuantity || 0),
      wastageQuantity: new Decimal(dto.wastageQuantity || 0),
      sourceDepartmentId: dto.sourceDepartmentId ?? undefined,
      targetDepartmentId: dto.targetDepartmentId ?? undefined,
      startDate: dto.startDate ?? undefined,
      endDate: dto.endDate ?? undefined,
      notes: dto.notes ?? undefined,
      status: dto.status || 'draft',
      unitCost: new Decimal(0),
      totalCost: new Decimal(0),
      laborCost: new Decimal(dto.laborCost || 0),
      overheadCost: new Decimal(dto.overheadCost || 0),
      createdBy: userId,
    });

    const saved = await manager.save(po);
    return this.findOneOrder(saved.id);
  }

  @Transactional()
  async updateOrder(id: string, dto: UpdateProductionOrderDto, userId: string): Promise<ProductionOrder> {
    const po = await this.findOneOrder(id);

    if (po.status === 'completed' || po.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya iptal edilmiş emirler değiştirilemez.');
    }

    if (dto.status === 'completed') {
      return this.completeOrder(id, dto, userId);
    } 

    if (dto.bomId !== undefined) po.bomId = dto.bomId;
    if (dto.plannedQuantity !== undefined) po.plannedQuantity = new Decimal(dto.plannedQuantity);
    if (dto.producedQuantity !== undefined) po.producedQuantity = new Decimal(dto.producedQuantity);
    if (dto.wastageQuantity !== undefined) po.wastageQuantity = new Decimal(dto.wastageQuantity);
    if (dto.sourceDepartmentId !== undefined) po.sourceDepartmentId = dto.sourceDepartmentId;
    if (dto.targetDepartmentId !== undefined) po.targetDepartmentId = dto.targetDepartmentId;
    if (dto.startDate !== undefined) po.startDate = dto.startDate;
    if (dto.endDate !== undefined) po.endDate = dto.endDate;
    if (dto.status !== undefined) po.status = dto.status;
    if (dto.laborCost !== undefined) po.laborCost = new Decimal(dto.laborCost);
    if (dto.overheadCost !== undefined) po.overheadCost = new Decimal(dto.overheadCost);
    if (dto.notes !== undefined) po.notes = dto.notes;
    
    po.updatedBy = userId || null;
    return this.poRepo.save(po);
  }

  private async completeOrder(id: string, dto: UpdateProductionOrderDto, userId: string): Promise<ProductionOrder> {
    const manager = this.transactionContext.manager;
    
    const po = await manager.findOne(ProductionOrder, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
      relations: ['bom', 'bom.items', 'bom.items.item', 'bom.targetItem']
    });

    if (!po || po.status === 'completed') throw new BadRequestException('İş emri bulunamadı veya zaten tamamlanmış.');
    if (!po.bom) throw new BadRequestException('İş emrine bağlı reçete bulunamadı. Silinmiş veya yetim kayıt olabilir.');

    const producedQty = new Decimal(dto.producedQuantity ?? po.producedQuantity);
    const sourceDeptId = dto.sourceDepartmentId ?? po.sourceDepartmentId;
    const targetDeptId = dto.targetDepartmentId ?? po.targetDepartmentId;

    if (producedQty.lte(0) || !sourceDeptId || !targetDeptId) {
      throw new BadRequestException('Miktar ve depo bilgileri eksik veya geçersiz.');
    }
    
    const targetItem = po.bom.targetItem;
    if (!targetItem) throw new BadRequestException('Hedef ürün bulunamadı.');

    // 1. Consumption
    const itemsToDecrease: { itemId: string; quantity: Decimal }[] = [];
    let totalMaterialCost = new Decimal(0);
    const sortedItems = [...po.bom.items].sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)));

    for (const bomItem of sortedItems) {
      const requiredQty = FH.mul(bomItem.quantity, producedQty);
      const cost = new Decimal(bomItem.item?.movingAverageCost || bomItem.item?.purchasePrice || 0);
      totalMaterialCost = FH.add(totalMaterialCost, FH.mul(requiredQty, cost));
      
      itemsToDecrease.push({ itemId: bomItem.itemId, quantity: requiredQty });
    }

    if (itemsToDecrease.length > 0) {
      await this.stocksService.decreaseStockBulk(
        itemsToDecrease, 
        sourceDeptId, 
        manager,
        { type: 'production', id: po.id, description: `Sarfiyat: ${po.code}` }, 
        userId
      );
    }

    // 2. Costs & Increase
    const labor = new Decimal(dto.laborCost ?? po.laborCost ?? 0);
    const overhead = new Decimal(dto.overheadCost ?? po.overheadCost ?? 0);
    const totalCost = FH.add(FH.add(totalMaterialCost, labor), overhead);
    const unitCost = FH.div(totalCost, producedQty, 4);

    await this.stocksService.increaseStock(
      targetItem.id, targetDeptId, producedQty, unitCost, manager,
      { type: 'production', id: po.id, description: `Üretim: ${po.code}` }, userId
    );

    // 3. Finalize
    await manager.update(ProductionOrder, po.id, {
      status: 'completed',
      producedQuantity: producedQty,
      sourceDepartmentId: sourceDeptId,
      targetDepartmentId: targetDeptId,
      unitCost,
      totalCost,
      laborCost: labor,
      overheadCost: overhead,
      endDate: dto.endDate ?? DateUtils.getToday(),
      updatedBy: userId
    });

    return this.findOneOrder(po.id);
  }

  async deleteOrder(id: string): Promise<void> {
    const po = await this.findOneOrder(id);
    if (po.status === 'completed' || po.status === 'in_progress') {
       throw new BadRequestException('Bu aşamadaki emirler silinemez.');
    }
    await this.poRepo.softDelete(id);
  }

  async getStatus() {
    const statuses: Array<ProductionOrder['status']> = ['draft', 'planned', 'in_progress', 'completed'];
    const counts = await Promise.all(statuses.map(s => this.poRepo.count({ where: { status: s } })));
    return {
      draft: counts[0], planned: counts[1], in_progress: counts[2], completed: counts[3],
      total: counts.reduce((a, b) => a + b, 0)
    };
  }
}