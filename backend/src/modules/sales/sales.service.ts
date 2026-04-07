import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { Stock } from '../inventory/stocks/entities/stock.entity';
import { StockMovement } from '../inventory/stocks/entities/stock-movement.entity';
import { Party } from '../parties/entities/party.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  CreateSaleTypeDto,
  ApproveSaleDto,
} from './dto/sale.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private saleItemRepo: Repository<SaleItem>,
    @InjectRepository(SaleType) private saleTypeRepo: Repository<SaleType>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
  ) {}

  // ────── SALE TYPES ──────

  async findAllSaleTypes(): Promise<SaleType[]> {
    return this.saleTypeRepo.find();
  }

  async createSaleType(dto: CreateSaleTypeDto, userId?: number): Promise<SaleType> {
    const type = new SaleType();
    type.name = dto.name;
    type.abbreviation = dto.abbreviation;
    type.createdBy = userId ?? null;
    return this.saleTypeRepo.save(type);
  }

  // ────── SALES CRUD ──────

  async findAll(query: PaginationDto & { status?: string; partyId?: number }): Promise<PaginatedResult<Sale>> {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.party', 'party')
      .leftJoinAndSelect('sale.saleType', 'saleType')
      .leftJoinAndSelect('sale.currency', 'currency')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.item', 'item');

    if (query.search) {
      qb.where('(sale.code LIKE :s OR party.name LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.status) qb.andWhere('sale.status = :status', { status: query.status });
    if (query.partyId) qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });

    qb.orderBy(`sale.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['party', 'saleType', 'currency', 'items', 'items.item'],
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    return sale;
  }

  /**
   * Yeni satış siparişi oluşturma (draft durumunda)
   * Transaction içinde: otomatik kod üretimi + kalem hesaplamaları
   */
  async create(dto: CreateSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Otomatik kod üret (pessimistic lock)
      const code = await this.sequenceGenerator.generateSaleCode(queryRunner, dto.saleTypeId);

      // 2. Kalemleri hesapla
      let totalAmount = 0;
      let totalKdv = 0;
      const saleItems: Partial<SaleItem>[] = [];

      for (const itemDto of dto.items) {
        const kdvRate = itemDto.kdvRate ?? 20;
        const discountAmount = itemDto.discountAmount || 0;
        const discountPercent = itemDto.discountPercent || 0;

        // Net fiyat hesabı: price - discount_amount veya price * (1 - discount_percent/100)
        let netPrice = itemDto.price;
        if (discountAmount > 0) {
          netPrice = itemDto.price - discountAmount;
        } else if (discountPercent > 0) {
          netPrice = itemDto.price * (1 - discountPercent / 100);
        }

        const subtotal = itemDto.quantity * netPrice;
        const kdvAmount = subtotal * (kdvRate / 100);
        const lineTotal = subtotal + kdvAmount;

        totalAmount += subtotal;
        totalKdv += kdvAmount;

        saleItems.push({
          itemId: itemDto.itemId,
          quantity: itemDto.quantity,
          price: itemDto.price,
          discountAmount,
          discountPercent,
          netPrice,
          kdvRate,
          kdvAmount,
          lineTotal,
          description: itemDto.description,
          createdBy: userId,
        });
      }

      // 3. Sipariş başlığı hesaplamaları
      const headerDiscountAmount = dto.discountAmount || 0;
      const headerDiscountPercent = dto.discountPercent || 0;

      let grandTotal = totalAmount;
      if (headerDiscountAmount > 0) {
        grandTotal -= headerDiscountAmount;
      } else if (headerDiscountPercent > 0) {
        grandTotal -= grandTotal * (headerDiscountPercent / 100);
      }
      grandTotal += totalKdv;

      // 4. Sale oluştur
      const sale = queryRunner.manager.create(Sale, {
        code,
        partyId: dto.partyId,
        saleTypeId: dto.saleTypeId,
        currencyId: dto.currencyId,
        deliveryDate: dto.deliveryDate,
        status: 'draft',
        deposit: dto.deposit || 0,
        totalAmount,
        discountAmount: headerDiscountAmount,
        discountPercent: headerDiscountPercent,
        kdv: totalKdv,
        grandTotal,
        notes: dto.notes,
        createdBy: userId,
      });

      const savedSale = await queryRunner.manager.save(sale);

      // 5. Kalemleri kaydet
      for (const si of saleItems) {
        const saleItem = queryRunner.manager.create(SaleItem, {
          ...si,
          saleId: savedSale.id,
        });
        await queryRunner.manager.save(saleItem);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedSale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateSaleDto, userId?: number): Promise<Sale> {
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir');
    }
    Object.assign(sale, dto);
    sale.updatedBy = userId || null;
    return this.saleRepo.save(sale);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * TRANSACTIONAL SALE APPROVAL — Projenin En Kritik İş Kuralı
   * ═══════════════════════════════════════════════════════════════════
   *
   * Bu metod TEK bir DB transaction içinde şunları yapar:
   *
   * 1. Sale status'unu draft → approved olarak günceller
   * 2. Her sale_item için:
   *    a. stocks tablosundan ilgili item+department stok satırını bulur
   *    b. Stok yeterliliğini kontrol eder (yetersizse → throw → ROLLBACK)
   *    c. stock.quantity'yi düşürür
   *    d. stock_movements'a 'out' kaydı yazar
   * 3. parties.balance'ı günceller (müşteriye grand_total kadar borç yazar)
   *
   * Herhangi bir adımda hata olursa TÜM İŞLEM ROLLBACK edilir.
   */
  async approveSale(saleId: number, dto: ApproveSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── 1. Sale'i kontrol et ──
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id: saleId },
        relations: ['items'],
      });

      if (!sale) {
        throw new NotFoundException('Satış bulunamadı');
      }

      if (sale.status !== 'draft') {
        throw new BadRequestException(
          `Sadece taslak durumundaki siparişler onaylanabilir. Mevcut durum: ${sale.status}`,
        );
      }

      if (!sale.items || sale.items.length === 0) {
        throw new BadRequestException('Satışta hiç kalem bulunmuyor');
      }

      this.logger.log(`🔄 Sale approval başlatıldı: ${sale.code} (${sale.items.length} kalem)`);

      // ── 2. Her kalem için stok düş ──
      for (const saleItem of sale.items) {
        // 2a. Stock kaydını bul
        let stock = await queryRunner.manager.findOne(Stock, {
          where: { itemId: saleItem.itemId, departmentId: dto.departmentId },
        });

        if (!stock) {
          // Stok kaydı yoksa, bu item bu departmanda hiç stoklanmamış demektir
          throw new BadRequestException(
            `Stok kaydı bulunamadı. Item ID: ${saleItem.itemId}, Departman ID: ${dto.departmentId}`,
          );
        }

        const quantityBefore = Number(stock.quantity);
        const requiredQty = Number(saleItem.quantity);

        // 2b. Stok yeterliliği kontrolü
        if (quantityBefore < requiredQty) {
          throw new BadRequestException(
            `Yetersiz stok! Item ID: ${saleItem.itemId}, ` +
            `Mevcut: ${quantityBefore}, İstenen: ${requiredQty}`,
          );
        }

        const quantityAfter = quantityBefore - requiredQty;

        // 2c. Stok düş
        await queryRunner.manager.update(Stock, stock.id, {
          quantity: quantityAfter,
          updatedBy: userId,
        });

        // 2d. Stok hareketi oluştur
        const movement = queryRunner.manager.create(StockMovement, {
          stockId: stock.id,
          quantity: requiredQty,
          quantityBefore,
          quantityAfter,
          type: 'out',
          referenceType: 'sale',
          referenceId: sale.id,
          description: `Satış onayı: ${sale.code}`,
          createdBy: userId,
        });
        await queryRunner.manager.save(movement);

        this.logger.debug(
          `  📦 Stok düşüldü: Item ${saleItem.itemId}, ${quantityBefore} → ${quantityAfter}`,
        );
      }

      // ── 3. Müşteri bakiyesini güncelle (borç yaz) ──
      const party = await queryRunner.manager.findOne(Party, {
        where: { id: sale.partyId },
      });

      if (!party) {
        throw new NotFoundException('Cari hesap bulunamadı');
      }

      const currentBalance = Number(party.balance);
      const grandTotal = Number(sale.grandTotal);
      const newBalance = currentBalance + grandTotal;

      await queryRunner.manager.update(Party, party.id, {
        balance: newBalance,
        updatedBy: userId,
      });

      this.logger.debug(
        `  💰 Cari bakiye güncellendi: ${party.name}, ${currentBalance} → ${newBalance} (+${grandTotal})`,
      );

      // ── 4. Sale durumunu güncelle ──
      await queryRunner.manager.update(Sale, sale.id, {
        status: 'approved',
        updatedBy: userId,
      });

      // ── 5. COMMIT ──
      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Sale onaylandı: ${sale.code}, Grand Total: ${grandTotal}, Party: ${party.name}`,
      );

      return this.findOne(saleId);
    } catch (error) {
      // ── ROLLBACK ──
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Sale approval ROLLBACK: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Satış iptali
   */
  async cancelSale(saleId: number, userId?: number): Promise<Sale> {
    const sale = await this.findOne(saleId);

    if (sale.status === 'cancelled') {
      throw new BadRequestException('Bu satış zaten iptal edilmiş');
    }

    // Eğer onaylanmış bir siparişse, stok ve bakiye geri alınmalı
    if (sale.status === 'approved' || sale.status === 'shipped' || sale.status === 'invoiced') {
      throw new BadRequestException(
        'Onaylanmış siparişlerin iptali için ayrı bir süreç gereklidir (iade/iptal faturası)',
      );
    }

    sale.status = 'cancelled';
    sale.updatedBy = userId || null;
    return this.saleRepo.save(sale);
  }

  async softDelete(id: number): Promise<void> {
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler silinebilir');
    }
    await this.saleRepo.softDelete(id);
  }

  async getStatus() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const [stats, pending] = await Promise.all([
      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal)", "revenue")
        .addSelect("COUNT(*)", "total")
        .where("sale.createdAt >= :date", { date: firstDayOfMonth.toISOString() })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne(),
      this.saleRepo.count({ where: { status: 'draft' } }), // Pending = Draft for now
    ]);

    return {
      monthlyRevenue: Number(stats.revenue || 0),
      monthlyOrders: Number(stats.total || 0),
      pendingOrders: Number(pending || 0),
    };
  }
}
