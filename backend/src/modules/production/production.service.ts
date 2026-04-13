import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { Item } from '../inventory/items/entities/item.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { StockMovement } from '../inventory/stocks/entities/stock-movement.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import {
  CreateBomDto, UpdateBomDto,
  CreateProductionOrderDto, UpdateProductionOrderDto,
  BomQueryDto, ProductionOrderQueryDto,
} from './dto/production.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { FinanceHelper as FH } from '../../common/utils/finance.helper';
import { DateUtils } from '../../common/utils/date.utils';
import dayjs from 'dayjs';

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
  ) {}

  // ────── BOMs (ÜRETİM REÇETELERİ) ──────

  async findAllBoms(query: BomQueryDto): Promise<PaginatedResult<Bom>> {
    const qb = this.bomRepo.createQueryBuilder('bom')
      .leftJoinAndSelect('bom.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('bom.targetItem', 'targetItem');

    if (query.search) {
      qb.andWhere('(bom.name LIKE :s OR targetItem.name LIKE :s OR targetItem.code LIKE :s)', { s: `%${query.search}%` });
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

  async createBom(dto: CreateBomDto, userId?: number): Promise<Bom> {
    let version = 1;

    if (dto.targetItemId) {
      const lastBom = await this.bomRepo.findOne({
        where: { targetItemId: dto.targetItemId },
        order: { version: 'DESC' },
      });
      if (lastBom) version = lastBom.version + 1;

      // Deactivate previous active BOM for this target item
      await this.bomRepo.update({ targetItemId: dto.targetItemId, isActive: true }, { isActive: false });
    }

    const bom = this.bomRepo.create({
      name: dto.name,
      description: dto.description || null,
      targetItemId: dto.targetItemId || null,
      version: version,
      isActive: true,
      createdBy: userId,
    });
    
    const savedBom = await this.bomRepo.save(bom);
    
    // Mükerrer ürünleri birleştir (quantity topla)
    const groupedItems = dto.items.reduce((acc, current) => {
      const existing = acc.find(i => i.itemId === current.itemId);
      if (existing) {
        existing.quantity = FH.add(existing.quantity, current.quantity);
      } else {
        acc.push({ ...current });
      }
      return acc;
    }, [] as any[]);
    
    for (const itemDto of groupedItems) {
      const item = await this.itemRepo.findOne({ where: { id: itemDto.itemId } });
      if (!item || item.state !== 1) {
        throw new BadRequestException(`Ürün bulunamadı veya pasif durumda (ID: ${itemDto.itemId}). Reçeteye eklenemez.`);
      }

      const bomItem = this.bomItemRepo.create({
        bomId: savedBom.id,
        itemId: itemDto.itemId,
        quantity: itemDto.quantity,
        description: itemDto.description || '',
        createdBy: userId,
      });
      await this.bomItemRepo.save(bomItem);
    }

    return this.findOneBom(savedBom.id);
  }

  async updateBom(id: number, dto: UpdateBomDto, userId?: number): Promise<Bom> {
    const bom = await this.findOneBom(id);
    if (dto.name !== undefined) bom.name = dto.name;
    if (dto.description !== undefined) bom.description = dto.description;
    if (dto.targetItemId !== undefined) bom.targetItemId = dto.targetItemId;
    if (dto.state !== undefined) bom.state = dto.state;
    bom.updatedBy = userId || null;
    return this.bomRepo.save(bom);
  }

  async deleteBom(id: number): Promise<void> {
    const bom = await this.findOneBom(id);
    
    // Check if BOM is used in any production orders
    const usageCount = await this.poRepo.count({ where: { bomId: id } });
    if (usageCount > 0) {
      throw new BadRequestException(`Bu reçete ${usageCount} adet üretim emrinde kullanılmaktadır ve silinemez. Arşivlemeyi deneyin.`);
    }

    await this.bomRepo.softDelete(id);
  }

  // ────── PRODUCTION ORDERS (ÜRETİM EMİRLERİ VE ONAYLARI) ──────

  async findAllOrders(query: ProductionOrderQueryDto): Promise<PaginatedResult<ProductionOrder>> {
    const qb = this.poRepo.createQueryBuilder('po')
      .leftJoinAndSelect('po.bom', 'bom')
      .leftJoinAndSelect('po.sourceDepartment', 'sourceDept')
      .leftJoinAndSelect('po.targetDepartment', 'targetDept');

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
      relations:['bom', 'bom.items', 'bom.items.item', 'sourceDepartment', 'targetDepartment'],
    });
    if (!po) throw new NotFoundException('Üretim emri bulunamadı');
    return po;
  }

  async createOrder(dto: CreateProductionOrderDto, userId?: number): Promise<ProductionOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bom = await this.findOneBom(dto.bomId);
      if (!bom.isActive) {
        throw new BadRequestException('Sadece aktif (aktif versiyon) reçeteler ile üretim emri oluşturulabilir.');
      }

      const code = await this.sequenceGenerator.generateProductionCode(queryRunner);

      const po = queryRunner.manager.create(ProductionOrder, {
        code,
        bomId: dto.bomId,
        plannedQuantity: dto.plannedQuantity,
        sourceDepartmentId: dto.sourceDepartmentId || null,
        targetDepartmentId: dto.targetDepartmentId || null,
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

  /**
   * ENTERPRISE BUSINESS LOGIC: Üretim Emrini İlerletme ve TAMAMLAMA 
   * Eğer statüs completed (tamamlandı) gelirse, transaction başlar ve depo stok hareketleri gerçekleştirilir.
   */
  async updateOrder(id: number, dto: UpdateProductionOrderDto, userId?: number): Promise<ProductionOrder> {
    const po = await this.findOneOrder(id);

    // EĞER ZATEN KAPATILMIŞ / İPTAL EDİLMİŞ İSE DEĞİŞİKLİĞİ ENGELLE
    if (po.status === 'completed' || po.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya iptal edilmiş üretim emirleri üzerinde değişiklik yapılamaz.');
    }

    // EĞER YENİ DURUM 'completed' (TAMAMLANDI) İSE STOK İŞLEMLERİNİ BAŞLAT
    if (dto.status === 'completed') {
      const producedQty = dto.producedQuantity ?? po.producedQuantity;
      const sourceDeptId = dto.sourceDepartmentId ?? po.sourceDepartmentId;
      const targetDeptId = dto.targetDepartmentId ?? po.targetDepartmentId;

      if (producedQty <= 0) throw new BadRequestException('Üretilen miktar 0 (sıfır) olarak işlem tamamlanamaz.');
      if (!sourceDeptId) throw new BadRequestException('Hammadde stok düşümü (sarf) için kaynak depo seçimi zorunludur.');
      if (!targetDeptId) throw new BadRequestException('Üretilen ürünün stoğa girebilmesi için hedef depo seçimi zorunludur.');
      
      const targetItem = po.bom.targetItem;
      if (!targetItem) throw new BadRequestException('Bu reçetede (BOM) çıkacak ana ürün belirlenmediği için stoklara üretim girişi yapılamıyor!');

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        let totalMaterialCost = 0;

        // 1. HER BİR HAMMADDE / SARF İÇİN ÇIKIŞ YAP (Source Department)
        for (const bomItem of po.bom.items) {
          const requiredQty = FH.mul(bomItem.quantity, producedQty);
          
          // MALİYET HESABI: Hammaddenin güncel alış fiyatı üzerinden
          const itemTotalCost = FH.mul(requiredQty, bomItem.item?.purchasePrice || 0);
          totalMaterialCost = FH.add(totalMaterialCost, itemTotalCost);

          let sourceStock = await queryRunner.manager.findOne(Stock, {
            where: { itemId: bomItem.itemId, departmentId: sourceDeptId }
          });

          if (!sourceStock || Number(sourceStock.quantity) < requiredQty) {
            throw new BadRequestException(
              `Depoda (ID: ${sourceDeptId}) YETERSİZ STOK: '${bomItem.item?.name}' maddesinden ${requiredQty} miktar sarf gerekiyor ancak ` +
              `${sourceStock ? sourceStock.quantity : 0} miktar bulundu. Üretim tamamlanamaz.`
            );
          }

          const quantityBeforeOut = Number(sourceStock.quantity);
          const quantityAfterOut = FH.sub(quantityBeforeOut, requiredQty);

          // Hammadde Stoku Güncelle
          await queryRunner.manager.update(Stock, sourceStock.id, {
            quantity: quantityAfterOut,
            updatedBy: userId
          });

          // Hammadde Out Logu
          const movementOut = queryRunner.manager.create(StockMovement, {
            stockId: sourceStock.id,
            quantity: requiredQty,
            quantityBefore: quantityBeforeOut,
            quantityAfter: quantityAfterOut,
            type: 'out',
            referenceType: 'production',
            referenceId: po.id,
            description: `Üretim Sarfiyat Çıkışı: İş Emri ${po.code}`,
            createdBy: userId
          });
          await queryRunner.manager.save(movementOut);
        }

        // 2. ÇIKAN (ÜRETİLEN) ÜRÜNÜ STOĞA GİRİŞ YAP (Target Department)
        let targetStock = await queryRunner.manager.findOne(Stock, {
          where: { itemId: targetItem.id, departmentId: targetDeptId }
        });

        if (!targetStock) {
          targetStock = queryRunner.manager.create(Stock, {
            itemId: targetItem.id,
            departmentId: targetDeptId,
            quantity: 0,
            createdBy: userId
          });
          targetStock = await queryRunner.manager.save(targetStock);
        }

        const quantityBeforeIn = Number(targetStock.quantity);
        const quantityAfterIn = FH.add(quantityBeforeIn, producedQty);

        // Mamül Stoğunu Artır
        await queryRunner.manager.update(Stock, targetStock.id, {
          quantity: quantityAfterIn,
          updatedBy: userId
        });

        // Üretilen ürünün birim maliyetini güncelle (Hammadde toplam maliyeti / miktar)
        const unitCost = FH.div(totalMaterialCost, producedQty, 4);
        await queryRunner.manager.update(Item, targetItem.id, {
          purchasePrice: unitCost,
          updatedBy: userId
        });

        // Mamül In Logu
        const movementIn = queryRunner.manager.create(StockMovement, {
          stockId: targetStock.id,
          quantity: producedQty,
          quantityBefore: quantityBeforeIn,
          quantityAfter: quantityAfterIn,
          type: 'in',
          referenceType: 'production',
          referenceId: po.id,
          description: `Üretim Mamül Girişi: İş Emri ${po.code}`,
          createdBy: userId
        });
        await queryRunner.manager.save(movementIn);

        // 3. EMİR TABLOSUNU GÜNCELLE
        await queryRunner.manager.update(ProductionOrder, po.id, {
          status: 'completed',
          producedQuantity: producedQty,
          wastageQuantity: dto.wastageQuantity ?? po.wastageQuantity,
          sourceDepartmentId: sourceDeptId,
          targetDepartmentId: targetDeptId,
          unitCost,
          totalCost: totalMaterialCost,
          endDate: dto.endDate ?? DateUtils.getToday(),
          notes: dto.notes ?? po.notes,
          updatedBy: userId
        });

        await queryRunner.commitTransaction();
        this.logger.log(`✅ İş Emri: ${po.code} başarıyla Tamamlandı ve depo giriş/çıkışları yansıdı.`);
        
        return this.findOneOrder(po.id);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`❌ Üretim kapatılırken hata oluştu: ${error.message}`);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } 

    // EĞER TAMAMLANDI DEĞİLSE SADECE KAYDI GÜNCELLE
    if (dto.plannedQuantity !== undefined) po.plannedQuantity = dto.plannedQuantity;
    if (dto.producedQuantity !== undefined) po.producedQuantity = dto.producedQuantity;
    if (dto.wastageQuantity !== undefined) po.wastageQuantity = dto.wastageQuantity;
    if (dto.sourceDepartmentId !== undefined) po.sourceDepartmentId = dto.sourceDepartmentId;
    if (dto.targetDepartmentId !== undefined) po.targetDepartmentId = dto.targetDepartmentId;
    if (dto.startDate !== undefined) po.startDate = dto.startDate;
    if (dto.endDate !== undefined) po.endDate = dto.endDate;
    if (dto.status !== undefined) po.status = dto.status as any;
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