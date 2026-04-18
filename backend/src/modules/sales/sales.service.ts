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

import { DateUtils } from '../../common/utils/date.utils';
import { Transactional } from '../../common/decorators/transactional.decorator';
import { TransactionContextService } from '../../common/services/transaction-context.service';
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

    private transactionContext: TransactionContextService,
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
      .leftJoinAndSelect('sale.currency', 'currency');

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

  @Transactional()
  async create(dto: CreateSaleDto, userId?: number): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const party = await manager.findOne(Party, { where: { id: dto.partyId } });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı.');
    if (party.type === 'provider') throw new BadRequestException('Sadece Tedarikçi tipindeki bir cariye satış yapılamaz.');

    const currency = await manager.findOne(Currency, { where: { id: dto.currencyId } });
    const currentExchangeRate = currency ? currency.exchangeRate : new Decimal(1);

    const code = await this.sequenceGenerator.generateSaleCode(manager, dto.saleTypeId);

    let rawTotalAmount = new Decimal(0);
    const saleItems: Partial<SaleItem>[] = [];

    for (const itemDto of dto.items) {
      const dbItem = await manager.findOne(Item, {
        where: { id: itemDto.itemId, state: 1 },
      });

      if (!dbItem) {
        throw new NotFoundException(`Ürün bulunamadı veya pasif durumda: ID ${itemDto.itemId}`);
      }

      const unitPrice = new Decimal(dbItem.salePrice || 0);
      const discountAmount = new Decimal(itemDto.discountAmount || 0);
      const discountPercent = new Decimal(itemDto.discountPercent || 0);
      
      const maxAllowedDiscount = unitPrice.mul(0.5);
      if (discountAmount.gt(maxAllowedDiscount)) {
        throw new BadRequestException(`Ürün ID ${itemDto.itemId} için maksimum iskonto sınırı (${maxAllowedDiscount}) aşıldı.`);
      }

      let netPrice = unitPrice;
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
        price: unitPrice,
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

    const sale = manager.create(Sale, {
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

    const savedSale = await manager.save(sale);

    const saleItemEntities = saleItems.map(si => manager.create(SaleItem, { ...si, saleId: savedSale.id }));
    await manager.save(SaleItem, saleItemEntities);

    return this.findOne(savedSale.id);
  }

  @Transactional()
  async update(id: number, dto: UpdateSaleDto, userId?: number): Promise<Sale> {
    const manager = this.transactionContext.manager;
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
    }

    if (dto.notes !== undefined) sale.notes = dto.notes;
    if (dto.deliveryDate !== undefined) sale.deliveryDate = dto.deliveryDate;
    sale.updatedBy = userId || null;

    if (dto.items && dto.items.length > 0) {
      let rawTotalAmount = new Decimal(0);
      const saleItems: Partial<SaleItem>[] = [];

      for (const itemDto of dto.items) {
        const dbItem = await manager.findOne(Item, {
          where: { id: itemDto.itemId, state: 1 },
        });

        if (!dbItem) {
          throw new NotFoundException(`Ürün bulunamadı veya pasif durumda: ID ${itemDto.itemId}`);
        }

        const unitPrice = new Decimal(dbItem.salePrice || 0);
        const discountAmount = new Decimal(itemDto.discountAmount || 0);
        const discountPercent = new Decimal(itemDto.discountPercent || 0);

        const maxAllowedDiscount = unitPrice.mul(0.5);
        if (discountAmount.gt(maxAllowedDiscount)) {
          throw new BadRequestException(`Ürün ID ${itemDto.itemId} için maksimum iskonto sınırı (${maxAllowedDiscount}) aşıldı.`);
        }

        let netPrice = unitPrice;
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
          price: unitPrice,
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

      await manager.delete(SaleItem, { saleId: sale.id });
      const saleItemEntities = saleItems.map(si => manager.create(SaleItem, { ...si, saleId: sale.id }));
      await manager.save(SaleItem, saleItemEntities);
    } else {
      if (dto.deposit !== undefined) sale.deposit = new Decimal(dto.deposit);
    }

    await manager.save(sale);
    return this.findOne(id);
  }

  @Transactional()
  async approveSale(saleId: number, dto: ApproveSaleDto, userId?: number): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { where: { id: saleId }, relations: ['items'] });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'draft') throw new BadRequestException('Sadece taslak durumundaki siparişler onaylanabilir.');

    const party = await manager.findOne(Party, { 
      where: { id: sale.partyId },
      lock: { mode: 'pessimistic_write' }
    });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');

    const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);

    if (party.creditLimit.gt(0) && (FH.add(party.balance, tlGrandTotal)).gt(party.creditLimit)) {
        throw new BadRequestException(`Cari limit aşıldı! Sipariş sonrası bakiye: ${FH.add(party.balance, tlGrandTotal)} olmaktadır.`);
    }

    sale.status = 'approved';
    sale.departmentId = dto.departmentId;
    sale.updatedBy = userId || null;
    await manager.save(Sale, sale);

    // SAGA ORCHESTRATION: Inventory and Finance logic merged synchronously
    
    // 1. Reserve Stock
    await this.stocksService.reserveStockBulk(
      sale.items.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
      dto.departmentId,
      manager,
      userId
    );

    // 2. Debit Party Ledger
    await manager.save(manager.create(AccountingLedger, {
      date: DateUtils.getToday(),
      partyId: sale.partyId,
      debit: tlGrandTotal,
      credit: new Decimal(0),
      transactionId: sale.id,
      source: 'SALE',
      description: `${sale.code} numaralı Satış Faturası Borçlandırması`
    }));

    party.balance = FH.add(party.balance, tlGrandTotal);

    // 3. Handle Deposit
    const depositToTL = FH.mul(sale.deposit, sale.exchangeRate);
    if (depositToTL.gt(0) && dto.commercialAccountId) {
      const txCode = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');
      
      await manager.save(manager.create(Transaction, {
        code: txCode, 
        partyId: party.id, 
        commercialAccountId: dto.commercialAccountId,
        amount: sale.deposit, 
        currencyId: sale.currencyId, 
        exchangeRate: sale.exchangeRate,
        type: 'in', 
        referenceType: 'sale', 
        referenceId: sale.id, 
        date: DateUtils.getToday(),
        description: `${sale.code} Nolu Sipariş Peşinat / Kaporası`, 
        status: 'completed', 
        createdBy: userId
      }));

      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        accountId: dto.commercialAccountId,
        debit: new Decimal(0),
        credit: depositToTL,
        transactionId: sale.id,
        source: 'DEPOSIT',
        description: `${sale.code} Sipariş Peşinat Tahsilatı`
      }));

      party.balance = FH.sub(party.balance, depositToTL);
    }

    party.updatedBy = userId || null;
    await manager.save(Party, party);

    this.logsService.logActivity({
      userId,
      module: 'sales',
      action: 'APPROVE_SALE',
      tag: 'SUCCESS',
      details: `Satış onaylandı: ${sale.code}, Toplam: ${sale.totalAmount}`,
    });

    return this.findOne(sale.id);
  }

  @Transactional()
  async cancelSale(saleId: number, userId?: number): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { 
      where: { id: saleId },
      relations: ['items', 'items.item']
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status === 'cancelled') throw new BadRequestException('Sipariş zaten iptal edilmiş.');

    if (sale.status === 'approved' || sale.status === 'shipped') {
      const party = await manager.findOne(Party, { 
        where: { id: sale.partyId },
        lock: { mode: 'pessimistic_write' }
      });
      if (!party) throw new NotFoundException('Cari hesap bulunamadı');
      
      await this.stocksService.revertStockMovementsByReference('sale', sale.id, manager, userId);

      const itemsToUnreserve = sale.items.map(si => ({
        itemId: si.itemId,
        quantity: new Decimal(si.quantity).sub(si.shippedQuantity || 0)
      })).filter(i => i.quantity.gt(0));

      if (itemsToUnreserve.length > 0) {
        await this.stocksService.unreserveStockBulk(itemsToUnreserve, sale.departmentId || 1, manager, userId);
      }

      const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);
      const tlDeposit = FH.mul(sale.deposit, sale.exchangeRate);
      
      const targetBalance = FH.add(FH.sub(party.balance, tlGrandTotal), tlDeposit);
      await manager.update(Party, party.id, { balance: targetBalance, updatedBy: userId });

      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        debit: new Decimal(0),
        credit: tlGrandTotal,
        transactionId: sale.id,
        source: 'CANCEL_SALE',
        description: `${sale.code} Satış İptali - Borç Revert`
      }));

      if (tlDeposit.gt(0)) {
        const depositTx = await manager.findOne(Transaction, { 
          where: { referenceType: 'sale', referenceId: sale.id, type: 'in' } 
        });
        
        await manager.save(manager.create(AccountingLedger, {
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

      await manager.update(Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
    }

    await manager.update(Sale, sale.id, { status: 'cancelled', updatedBy: userId });
    return this.findOne(saleId);
  }

  async softDelete(id: number): Promise<void> {
    const sale = await this.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler kalıcı silinebilir.');
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
      monthlyRevenue: new Decimal(stats.revenue || 0),
      monthlyOrders: new Decimal(stats.total || 0),
      pendingOrders: new Decimal(pending || 0),
    };
  }

  @Transactional()
  async shipSale(saleId: number, dto: ShipSaleDto, userId?: number): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { where: { id: saleId }, relations: ['items'] });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'approved' && sale.status !== 'shipped') {
      throw new BadRequestException('Sadece onaylanmış veya kısmi sevk edilmiş siparişler sevk edilebilir.');
    }

    if (!sale.departmentId) throw new BadRequestException('Rezervasyon deposu bulunamadı.');

    const shipItems = dto.items || sale.items.map(i => ({ itemId: Number(i.itemId), quantity: Number(i.quantity) }));

    for (const reqItem of shipItems) {
      const lineItem = sale.items.find(si => Number(si.itemId) === Number(reqItem.itemId));
      if (!lineItem) throw new BadRequestException(`Ürün ID ${reqItem.itemId} bu siparişte yok.`);

      const orderQty = new Decimal(lineItem.quantity);
      const alreadyShipped = new Decimal(lineItem.shippedQuantity || 0);
      const remainingQty = orderQty.minus(alreadyShipped);
      const requestedQty = new Decimal(reqItem.quantity);

      if (requestedQty.gt(remainingQty)) {
        throw new BadRequestException(`Ürün ID ${reqItem.itemId}: Maksimum sevk edilebilir miktar ${remainingQty}.`);
      }
    }

    await this.stocksService.finalizeShipmentBulk(
      shipItems,
      sale.departmentId,
      manager,
      { type: 'sale', id: sale.id, description: `Sevkiyat Çıkışı: ${sale.code}` },
      userId
    );

    for (const item of shipItems) {
       const saleItem = sale.items.find(si => Number(si.itemId) === Number(item.itemId));
       if (saleItem) {
          saleItem.shippedQuantity = new Decimal(saleItem.shippedQuantity || 0).add(item.quantity);
          await manager.save(SaleItem, saleItem);
       }
    }

    sale.status = 'shipped';
    sale.updatedBy = userId || null;
    await manager.save(Sale, sale);

    this.logsService.logActivity({
      userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
      details: `Sevkiyat yapıldı: ${sale.code}`
    });

    return this.findOne(sale.id);
  }
}