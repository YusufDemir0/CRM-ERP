import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { StocksService } from '../inventory/stocks/stocks.service';
import { LogsService } from '../logs/logs.service';
import { Item } from '../inventory/items/entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';

import { Party } from '../parties/entities/party.entity';
import { Currency } from '../finance/currencies/entities/currency.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';
import { Department } from '../departments/entities/department.entity';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { Decimal } from 'decimal.js';
import {
  CreateSaleDto,
  UpdateSaleDto,
  CreateSaleTypeDto,
  ApproveSaleDto,
  ShipSaleDto,
} from './dto/sale.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { FinanceHelper as FH } from '../../common/utils/finance.helper';
import { AccountingLedger } from '../parties/entities/ledger.entity';
import { InternalEventBus } from '../../common/services/event-bus.service';
import { DateUtils } from '../../common/utils/date.utils';
import dayjs from 'dayjs';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private saleItemRepo: Repository<SaleItem>,
    @InjectRepository(SaleType) private saleTypeRepo: Repository<SaleType>,
    private dataSource: DataSource,
    private sequenceGenerator: SequenceGeneratorService,
    private stocksService: StocksService,
    private logsService: LogsService,
    private eventBus: InternalEventBus,
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

    const[data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
    };
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations:['party', 'saleType', 'currency', 'items', 'items.item'],
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    return sale;
  }

  async create(dto: CreateSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const party = await queryRunner.manager.findOne(Party, { where: { id: dto.partyId } });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı.');
      if (party.type === 'provider') throw new BadRequestException('Sadece Tedarikçi tipindeki bir cariye satış yapılamaz.');

      const currency = await queryRunner.manager.findOne(Currency, { where: { id: dto.currencyId } });
      const currentExchangeRate = currency ? currency.exchangeRate : new Decimal(1);

      const code = await this.sequenceGenerator.generateSaleCode(queryRunner, dto.saleTypeId);

      let rawTotalAmount = new Decimal(0);
      const saleItems: Partial<SaleItem>[] =[];

      for (const itemDto of dto.items) {
        const discountAmount = new Decimal(itemDto.discountAmount || 0);
        const discountPercent = new Decimal(itemDto.discountPercent || 0);
        
        let netPrice = new Decimal(itemDto.price);
        if (discountAmount.gt(0)) {
          netPrice = FH.sub(netPrice, discountAmount);
        } else if (discountPercent.gt(0)) {
          const discount = FH.mul(netPrice, discountPercent.div(100));
          netPrice = FH.sub(netPrice, discount);
        }

        const subtotal = FH.mul(itemDto.quantity, netPrice);
        rawTotalAmount = FH.add(rawTotalAmount, subtotal);

        saleItems.push({
          itemId: itemDto.itemId,
          quantity: new Decimal(itemDto.quantity),
          price: new Decimal(itemDto.price),
          discountAmount,
          discountPercent,
          netPrice,
          kdvRate: new Decimal(itemDto.kdvRate ?? 20),
          description: itemDto.description,
          createdBy: userId,
        });
      }

      const headerDiscountAmount = new Decimal(dto.discountAmount || 0);
      const headerDiscountPercent = new Decimal(dto.discountPercent || 0);
      let discountToSubtract = headerDiscountAmount;

      if (headerDiscountPercent.gt(0)) {
        discountToSubtract = FH.mul(rawTotalAmount, headerDiscountPercent.div(100));
      }
      
      const discountedMatrah = FH.sub(rawTotalAmount, discountToSubtract);

      let totalKdv = new Decimal(0);
      saleItems.forEach(item => {
        const lineRatio = rawTotalAmount.gt(0) ? FH.div(FH.mul(item.quantity!, item.netPrice!), rawTotalAmount, 6) : new Decimal(0);
        const lineMatrah = FH.mul(discountedMatrah, lineRatio);
        const lineKdv = FH.calculateKdv(lineMatrah, Number(item.kdvRate!));
        
        item.kdvAmount = lineKdv;
        item.lineTotal = FH.add(lineMatrah, lineKdv);
        totalKdv = FH.add(totalKdv, lineKdv);
      });

      const grandTotal = FH.add(discountedMatrah, totalKdv);

      const sale = queryRunner.manager.create(Sale, {
        code,
        partyId: dto.partyId,
        saleTypeId: dto.saleTypeId,
        currencyId: dto.currencyId,
        exchangeRate: currentExchangeRate,
        deliveryDate: dto.deliveryDate,
        status: 'draft',
        deposit: new Decimal(dto.deposit || 0),
        totalAmount: rawTotalAmount,
        discountAmount: headerDiscountAmount,
        discountPercent: headerDiscountPercent,
        kdv: totalKdv,
        grandTotal,
        notes: dto.notes,
        createdBy: userId,
      });

      const savedSale = await queryRunner.manager.save(sale);

      for (const si of saleItems) {
        await queryRunner.manager.save(queryRunner.manager.create(SaleItem, { ...si, saleId: savedSale.id }));
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
      throw new BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir. İptal / İade süreçlerini kullanın.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.notes !== undefined) sale.notes = dto.notes;
      if (dto.deliveryDate !== undefined) sale.deliveryDate = dto.deliveryDate;
      sale.updatedBy = userId || null;

      // İç İçe (Nested) Güncelleme: Kalemler gönderildiyse tüm matrah, indirim ve KDV baştan hesaplanır
      if (dto.items && dto.items.length > 0) {
        let rawTotalAmount = new Decimal(0);
        const saleItems: Partial<SaleItem>[] =[];

        for (const itemDto of dto.items) {
          const discountAmount = new Decimal(itemDto.discountAmount || 0);
          const discountPercent = new Decimal(itemDto.discountPercent || 0);
          let netPrice = new Decimal(itemDto.price);
          
          if (discountAmount.gt(0)) {
            netPrice = FH.sub(netPrice, discountAmount);
          } else if (discountPercent.gt(0)) {
            const discount = FH.mul(netPrice, discountPercent.div(100));
            netPrice = FH.sub(netPrice, discount);
          }
          
          rawTotalAmount = FH.add(rawTotalAmount, FH.mul(itemDto.quantity, netPrice));
          
          saleItems.push({
            itemId: itemDto.itemId, 
            quantity: new Decimal(itemDto.quantity), 
            price: new Decimal(itemDto.price),
            discountAmount, 
            discountPercent, 
            netPrice, 
            kdvRate: new Decimal(itemDto.kdvRate ?? 20),
            description: itemDto.description, 
            createdBy: userId,
          });
        }

        const headerDiscountAmount = new Decimal(dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount);
        const headerDiscountPercent = new Decimal(dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent);
        let discountToSubtract = headerDiscountAmount;
        if (headerDiscountPercent.gt(0)) {
          discountToSubtract = FH.mul(rawTotalAmount, headerDiscountPercent.div(100));
        }
        
        const discountedMatrah = FH.sub(rawTotalAmount, discountToSubtract);

        let totalKdv = new Decimal(0);
        saleItems.forEach(item => {
          const lineRatio = rawTotalAmount.gt(0) 
            ? FH.div(FH.mul(item.quantity!, item.netPrice!), rawTotalAmount, 6) 
            : new Decimal(0);
          const lineMatrah = FH.mul(discountedMatrah, lineRatio);
          const lineKdv = FH.calculateKdv(lineMatrah, Number(item.kdvRate!));
          item.kdvAmount = lineKdv;
          item.lineTotal = FH.add(lineMatrah, lineKdv);
          totalKdv = FH.add(totalKdv, lineKdv);
        });

        sale.totalAmount = rawTotalAmount;
        sale.discountAmount = headerDiscountAmount;
        sale.discountPercent = headerDiscountPercent;
        sale.kdv = totalKdv;
        sale.grandTotal = FH.add(discountedMatrah, totalKdv);
        sale.deposit = new Decimal(dto.deposit !== undefined ? dto.deposit : sale.deposit);

        // Eski kalemleri silip yenilerini ekleyelim
        await queryRunner.manager.delete(SaleItem, { saleId: sale.id });
        for (const si of saleItems) {
          await queryRunner.manager.save(queryRunner.manager.create(SaleItem, { ...si, saleId: sale.id }));
        }
      } else {
        // Kalem gelmediyse bile kapora ve notlar gibi verileri güncelle
        if (dto.deposit !== undefined) sale.deposit = new Decimal(dto.deposit);
      }

      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  // EN KRİTİK ALAN: STOK DÜŞÜŞ, BAKİYE ARTIRIMI, KAPORA TAHSİLATI (TRANSACTIONAL)
  async approveSale(saleId: number, dto: ApproveSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, { where: { id: saleId }, relations: ['items'] });
      if (!sale) throw new NotFoundException('Satış bulunamadı');
      if (sale.status !== 'draft') throw new BadRequestException('Sadece taslak (draft) durumundaki siparişler onaylanabilir.');

      const party = await queryRunner.manager.findOne(Party, { 
        where: { id: sale.partyId },
        lock: { mode: 'pessimistic_write' }
      });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı');

      const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);

      // KREDİ LİMİT KONTROLÜ (Still needed before approval)
      if (party.creditLimit.gt(0) && (FH.add(party.balance, tlGrandTotal)).gt(party.creditLimit)) {
         throw new BadRequestException(`Cari limit aşıldı! Firmanın Kredi Limiti: ${party.creditLimit}. Sipariş sonrası bakiye: ${FH.add(party.balance, tlGrandTotal)} olmaktadır. İşlem gerçekleştirilemez.`);
      }

      sale.status = 'approved';
      sale.departmentId = dto.departmentId;
      sale.updatedBy = userId || null;
      await queryRunner.manager.save(Sale, sale);

      // Emit event for decoupled modules (Inventory, Finance)
      // SYNC & TRANSACTIONAL: We pass the manager so listeners run in the SAME transaction.
      await this.eventBus.emitSync('sale.approved', { 
        sale, 
        departmentId: dto.departmentId, 
        tlGrandTotal,
        deposit: FH.mul(sale.deposit, sale.exchangeRate),
        commercialAccountId: dto.commercialAccountId,
        userId,
        manager: queryRunner.manager // CRITICAL: Share transaction
      });

      await queryRunner.commitTransaction();
      
      this.logsService.logActivity({
        userId,
        module: 'sales',
        action: 'APPROVE_SALE',
        tag: 'SUCCESS',
        details: `Satış onaylandı: ${sale.code}, Toplam: ${sale.totalAmount} ${sale.currency?.code || 'TL'}`,
      });

      return this.findOne(sale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Sipariş Onay Hata: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // TERS İŞLEM REVERT MANTIĞI: (Bozulan siparişi komple silmek yerine iade/iptal alma)
  async cancelSale(saleId: number, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, { where: { id: saleId } });
      if (!sale) throw new NotFoundException('Satış bulunamadı');
      if (sale.status === 'cancelled') throw new BadRequestException('Sipariş zaten iptal edilmiş.');

      if (sale.status === 'approved' || sale.status === 'shipped') {
        const party = await queryRunner.manager.findOne(Party, { 
          where: { id: sale.partyId },
          lock: { mode: 'pessimistic_write' }
        });
        if (!party) throw new NotFoundException('Cari hesap bulunamadı');
        
        // 1. Stok Revert (Eğer sevkiyat yapıldıysa fiziksel iade, sadece onaylandıysa rezervasyon iptali)
        if (sale.status === 'shipped') {
           await this.stocksService.revertStockMovementsByReference('sale', sale.id, queryRunner.manager, userId);
        } else {
           await this.stocksService.unreserveStockBulk(sale.items, sale.departmentId || 1, queryRunner.manager, userId);
        }

        // 2. Bakiyeyi geri al - Atomic Adjustments
        const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);
        const tlDeposit = FH.mul(sale.deposit, sale.exchangeRate);
        
        // Cari kilitlendiği için güvenli güncelleme
        const targetBalance = FH.add(FH.sub(party.balance, tlGrandTotal), tlDeposit);
        await queryRunner.manager.update(Party, party.id, { balance: targetBalance, updatedBy: userId });

        // 3. Defter Kayıtlarını Geri Al (Audit Trail)
        // Satış Borçlandırması Ters Kayıt (Alacak)
        await queryRunner.manager.save(queryRunner.manager.create(AccountingLedger, {
          date: DateUtils.getToday(),
          partyId: party.id,
          debit: new Decimal(0),
          credit: tlGrandTotal,
          transactionId: sale.id,
          source: 'CANCEL_SALE',
          description: `${sale.code} Satış İptali - Borç Revert`
        }));

        // Kapora Alacağı Ters Kayıt (Borç)
        if (tlDeposit.gt(0)) {
          const depositTx = await queryRunner.manager.findOne(Transaction, { 
            where: { referenceType: 'sale', referenceId: sale.id, type: 'in' } 
          });
          
          await queryRunner.manager.save(queryRunner.manager.create(AccountingLedger, {
            date: DateUtils.getToday(),
            partyId: party.id,
            accountId: depositTx?.commercialAccountId,
            debit: tlDeposit,
            credit: new Decimal(0),
            transactionId: sale.id,
            source: 'CANCEL_DEPOSIT',
            description: `${sale.code} Kapora İptali - Alacak Revert`
          }));
        }

        // 4. Fatura ödemesini/Kaporasını iptal edilmiş işaretle
        await queryRunner.manager.update(Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
      }

      await queryRunner.manager.update(Sale, sale.id, { status: 'cancelled', updatedBy: userId });
      await queryRunner.commitTransaction();
      return this.findOne(saleId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async softDelete(id: number): Promise<void> {
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler kalıcı silinebilir. Onaylanmış faturalar için "İptal Et / Revert" işlemi yapınız.');
    }
    await this.saleRepo.softDelete(id);
  }

  async getStatus() {
    const firstDayOfMonth = dayjs().startOf('month').toDate();

    const [stats, pending] = await Promise.all([
      this.saleRepo.createQueryBuilder('sale')
        .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
        .addSelect("COUNT(*)", "total")
        .where("sale.createdAt >= :date", { date: DateUtils.getStartOfDay(firstDayOfMonth) })
        .andWhere("sale.status != 'cancelled'")
        .getRawOne(),
      this.saleRepo.count({ where: { status: 'draft' } }),
    ]);

    return {
      monthlyRevenue: Number(stats.revenue || 0),
      monthlyOrders: Number(stats.total || 0),
      pendingOrders: Number(pending || 0),
    };
  }

  async shipSale(saleId: number, dto: ShipSaleDto, userId?: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, { where: { id: saleId }, relations: ['items'] });
      if (!sale) throw new NotFoundException('Satış bulunamadı');
      if (sale.status !== 'approved' && sale.status !== 'shipped') {
        throw new BadRequestException('Sadece onaylanmış veya kısmi sevk edilmiş siparişler sevk edilebilir.');
      }

      if (!sale.departmentId) throw new BadRequestException('Bu satışın rezerve edildiği depo bilgisi bulunamadı.');

      const shipItems = dto.items || sale.items.map(i => ({ itemId: Number(i.itemId), quantity: Number(i.quantity) }));

      await this.stocksService.finalizeShipmentBulk(
        shipItems as any,
        sale.departmentId,
        queryRunner.manager,
        { type: 'sale', id: sale.id, description: `Sevkiyat Çıkışı: ${sale.code}` },
        userId
      );

      for (const item of shipItems) {
         const saleItem = sale.items.find(si => Number(si.itemId) === Number(item.itemId));
         if (saleItem) {
            saleItem.shippedQuantity = new Decimal(saleItem.shippedQuantity || 0).add(item.quantity);
            await queryRunner.manager.save(SaleItem, saleItem);
         }
      }

      sale.status = 'shipped';
      sale.updatedBy = userId || null;
      await queryRunner.manager.save(Sale, sale);

      await queryRunner.commitTransaction();

      this.logsService.logActivity({
        userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
        details: `Sevkiyat yapıldı: ${sale.code}`
      });

      return this.findOne(sale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}