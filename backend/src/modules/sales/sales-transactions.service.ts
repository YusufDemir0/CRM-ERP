import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transactional } from '@nestjs-cls/transactional';

import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { Party } from '../parties/entities/party.entity';
import { Currency } from '../finance/currencies/entities/currency.entity';
import { User } from '../auth/entities/user.entity';
import { Staff } from '../staff/entities/staff.entity';
import { CommercialAccount } from '../finance/accounts/entities/commercial-account.entity';
import { AccountingLedger } from '../parties/entities/ledger.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';

import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, ShipSaleDto } from './dto/sale.dto';
import { StocksService } from '../inventory/stocks/stocks.service';
import { LogsService } from '../logs/logs.service';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { OutboxService } from '../../common/services/outbox.service';
import { SalesReportsService } from './sales-reports.service';
import { SaleCalculator } from './domain/sale-calculator';
import { FinanceHelper as FH } from '../../common/utils/finance.helper';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class SalesTransactionsService {
  private readonly logger = new Logger(SalesTransactionsService.name);

  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private saleItemRepo: Repository<SaleItem>,
    @InjectRepository(SaleType) private saleTypeRepo: Repository<SaleType>,
    private sequenceGenerator: SequenceGeneratorService,
    private stocksService: StocksService,
    private logsService: LogsService,
    private transactionContext: TransactionContextService,
    private outboxService: OutboxService,
    private reportsService: SalesReportsService,
  ) {}

  async createSaleType(dto: CreateSaleTypeDto, userId: string): Promise<SaleType> {
    const type = new SaleType();
    type.name = dto.name;
    type.abbreviation = dto.abbreviation;
    type.createdBy = userId ?? null;
    return this.saleTypeRepo.save(type);
  }

  @Transactional()
  async create(dto: CreateSaleDto, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const party = await manager.findOne(Party, { where: { id: dto.partyId } });
    if (!party) throw new NotFoundException('Cari bulunamadı.');
    if (party.state === 0) throw new BadRequestException('Pasif durumdaki bir cariye işlem yapılamaz.');

    const saleType = await manager.findOne(SaleType, { where: { id: dto.saleTypeId } });
    if (!saleType) throw new NotFoundException('Satış tipi bulunamadı.');

    const currency = await manager.findOne(Currency, { where: { id: dto.currencyId || "1" } });
    if (!currency) throw new NotFoundException('Döviz birimi bulunamadı.');
    const currentExchangeRate = currency.exchangeRate || new Decimal(1);

    if (dto.staffId) {
      const staffExists = await manager.count(Staff, { where: { id: dto.staffId } });
      if (staffExists === 0) throw new NotFoundException('Satış temsilcisi bulunamadı.');
    }

    if (dto.commercialAccountId) {
      const accountExists = await manager.count(CommercialAccount, { where: { id: dto.commercialAccountId } });
      if (accountExists === 0) throw new NotFoundException('Ticari hesap bulunamadı.');
    }

    const user = await manager.findOne(User, { where: { id: userId } });
    const userDeptId = user?.departmentId || 1;

    const code = await this.sequenceGenerator.generateSaleCode(manager, String(userDeptId));

    const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
    const calcResult = SaleCalculator.calculate(
      dto.items,
      itemDataMap,
      dto.discountAmount,
      dto.discountPercent
    );

    const sale = manager.create(Sale, {
      ...dto,
      code,
      exchangeRate: currentExchangeRate,
      status: 'draft',
      deposit: new Decimal(dto.deposit || 0),
      totalAmount: calcResult.totalAmount,
      discountAmount: calcResult.discountAmount,
      discountPercent: calcResult.discountPercent,
      kdv: calcResult.kdv,
      grandTotal: calcResult.grandTotal,
      totalCost: calcResult.totalCost,
      profit: calcResult.profit,
      createdBy: userId,
    });

    const savedSale = await manager.save(sale);

    const saleItemEntities = calcResult.lines.map(line => manager.create(SaleItem, {
      ...line,
      saleId: savedSale.id,
      shippedQuantity: new Decimal(0),
      costPrice: line.costPrice,
      createdBy: userId
    }));
    await manager.save(SaleItem, saleItemEntities);

    return this.reportsService.findOne(savedSale.id, manager);
  }

  @Transactional()
  async update(id: string, dto: UpdateSaleDto, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;
    const sale = await this.reportsService.findOne(id, manager);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
    }

    const updatableFields: (keyof UpdateSaleDto)[] = [
      'notes', 'deliveryDate', 'staffId', 'phone', 'address', 'taxNumber',
      'email', 'source', 'city', 'district', 'commercialAccountId'
    ];
    updatableFields.forEach(field => {
      if (dto[field] !== undefined) (sale as unknown as Record<string, unknown>)[field] = dto[field];
    });
    sale.updatedBy = userId || null;

    if (dto.items && dto.items.length > 0) {
      const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
      const calcResult = SaleCalculator.calculate(
        dto.items,
        itemDataMap,
        dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount,
        dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent
      );

      sale.totalAmount = calcResult.totalAmount;
      sale.discountAmount = calcResult.discountAmount;
      sale.discountPercent = calcResult.discountPercent;
      sale.kdv = calcResult.kdv;
      sale.grandTotal = calcResult.grandTotal;
      sale.totalCost = calcResult.totalCost;
      sale.profit = calcResult.profit;
      if (dto.deposit !== undefined) sale.deposit = new Decimal(dto.deposit);

      await manager.delete(SaleItem, { saleId: sale.id });
      const saleItemEntities = calcResult.lines.map(line => manager.create(SaleItem, {
        ...line,
        saleId: sale.id,
        costPrice: line.costPrice,
        updatedBy: userId
      }));
      await manager.save(SaleItem, saleItemEntities);
    } else if (dto.deposit !== undefined) {
      sale.deposit = new Decimal(dto.deposit);
    }

    await manager.save(sale);
    return this.reportsService.findOne(id, manager);
  }

  @Transactional()
  async approveSale(saleId: string, dto: ApproveSaleDto, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'draft') throw new BadRequestException('Sadece taslak durumundaki siparişler onaylanabilir.');

    const party = await manager.findOne(Party, {
      where: { id: sale.partyId },
      lock: { mode: 'pessimistic_write' }
    });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');

    const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);
    const depositToTL = FH.mul(sale.deposit, sale.exchangeRate);

    if (party.creditLimit.gt(0) && (FH.add(party.balance, tlGrandTotal)).gt(party.creditLimit)) {
      throw new BadRequestException(`Cari limit aşıldı! Sipariş sonrası bakiye: ${FH.add(party.balance, tlGrandTotal)} olmaktadır.`);
    }

    sale.status = 'approved';
    sale.departmentId = dto.departmentId;
    sale.updatedBy = userId || null;
    await manager.save(Sale, sale);

    await this.outboxService.saveEvent({
      topic: 'sale.approved',
      payload: {
        sale,
        tlGrandTotal,
        deposit: depositToTL,
        departmentId: dto.departmentId,
        commercialAccountId: dto.commercialAccountId,
        userId,
      },
      manager,
    });

    this.logsService.logActivity({
      userId,
      module: 'sales',
      action: 'APPROVE_SALE',
      tag: 'SUCCESS',
      details: `Satış onaylandı: ${sale.code}, Toplam: ${sale.totalAmount}`,
    });

    return this.reportsService.findOne(sale.id, manager);
  }

  @Transactional()
  async cancelSale(saleId: string, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, {
      where: { id: saleId },
      relations: ['items', 'items.item']
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status === 'cancelled') throw new BadRequestException('Sipariş zaten iptal edilmiş.');

    const previousStatus = sale.status;

    if (previousStatus === 'approved' || previousStatus === 'shipped') {
      const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);
      const tlDeposit = FH.mul(sale.deposit, sale.exchangeRate);

      await this.outboxService.saveEvent({
        topic: 'sale.cancelled',
        payload: {
          sale,
          tlGrandTotal,
          tlDeposit,
          userId,
        },
        manager,
      });
      
      // Update the transaction status immediately so UI knows it's cancelled
      await manager.update(Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
    }

    await manager.update(Sale, sale.id, { status: 'cancelled', updatedBy: userId });
    return this.reportsService.findOne(saleId, manager);
  }

  @Transactional()
  async shipSale(saleId: string, dto: ShipSaleDto, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'approved' && sale.status !== 'shipped') {
      throw new BadRequestException('Sadece onaylanmış veya kısmi sevk edilmiş siparişler sevk edilebilir.');
    }

    if (!sale.departmentId) throw new BadRequestException('Rezervasyon deposu bulunamadı.');

    const shipItems = dto.items || sale.items.map(i => ({ itemId: String(i.itemId), quantity: Number(i.quantity) }));

    for (const reqItem of shipItems) {
      const lineItem = sale.items.find(si => String(si.itemId) === String(reqItem.itemId));
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

    const saleItemsToUpdate: SaleItem[] = [];
    for (const item of shipItems) {
      const saleItem = sale.items.find(si => String(si.itemId) === String(item.itemId));
      if (saleItem) {
        saleItem.shippedQuantity = new Decimal(saleItem.shippedQuantity || 0).add(item.quantity);
        saleItemsToUpdate.push(saleItem);
      }
    }
    
    if (saleItemsToUpdate.length > 0) {
      await manager.save(SaleItem, saleItemsToUpdate);
    }

    sale.status = 'shipped';
    sale.updatedBy = userId || null;
    await manager.save(Sale, sale);

    this.logsService.logActivity({
      userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
      details: `Sevkiyat yapıldı: ${sale.code}`
    });

    return this.reportsService.findOne(sale.id, manager);
  }

  async softDelete(id: string): Promise<void> {
    const sale = await this.reportsService.findOne(id);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler kalıcı silinebilir.');
    }
    await this.saleRepo.softDelete(id);
  }
}
