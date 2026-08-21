import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In, Like } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Transactional } from '@nestjs-cls/transactional';

import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleType } from './entities/sale-type.entity';
import { SaleInstallment } from './entities/sale-installment.entity';
import { Party } from '../parties/entities/party.entity';
import { Currency } from '../finance/currencies/entities/currency.entity';
import { User } from '../auth/entities/user.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Vehicle } from '../inventory/stocks/entities/vehicle.entity';
import { CommercialAccount } from '../finance/accounts/entities/commercial-account.entity';
import { AccountingLedger } from '../parties/entities/ledger.entity';
import { Transaction } from '../finance/transactions/entities/transaction.entity';

import { CreateSaleDto, UpdateSaleDto, CreateSaleTypeDto, ApproveSaleDto, ShipSaleDto } from './dto/sale.dto';
import { StockMovement } from '../inventory/stocks/entities/stock-movement.entity';
import { Shipment } from '../inventory/stocks/entities/shipment.entity';
import { StocksService } from '../inventory/stocks/stocks.service';
import { LogsService } from '../logs/logs.service';
import { SequenceGeneratorService } from '../../common/services/sequence-generator.service';
import { TransactionContextService } from '../../common/services/transaction-context.service';
import { OutboxService } from '../../common/services/outbox.service';
import { SalesReportsService } from './sales-reports.service';
import { SaleCalculator } from './domain/sale-calculator';
import { FinanceHelper as FH } from '../../common/utils/finance.helper';
import { DateUtils } from '../../common/utils/date.utils';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

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

    const party = await manager.findOne(Party, { where: { id: dto.partyId }, lock: { mode: 'pessimistic_write' } });
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

    const isRetail = saleType.abbreviation === 'PRK';

    const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
    const calcResult = SaleCalculator.calculate(
      dto.items,
      itemDataMap,
      dto.discountAmount,
      dto.discountPercent,
      isRetail,
      dto.representativePrice
    );

    const depositAmount = new Decimal(dto.deposit || 0);
    if (depositAmount.gt(calcResult.grandTotal)) {
      throw new BadRequestException('Kapora tutarı toplam satış tutarından büyük olamaz.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dto.deliveryDate && dto.deliveryDate < todayStr) {
      throw new BadRequestException('Teslimat tarihi bugünden önceki bir tarih olamaz.');
    }

    // Destructure items and other DTO-only fields to prevent TypeORM from cascade-saving them
    const { items: _dtoItems, ...saleFields } = dto;

    const sale = manager.create(Sale, {
      ...saleFields,
      code,
      exchangeRate: currentExchangeRate,
      status: 'draft',
      deposit: depositAmount,
      totalAmount: calcResult.totalAmount,
      discountAmount: calcResult.discountAmount,
      discountPercent: calcResult.discountPercent,
      kdv: calcResult.kdv,
      grandTotal: calcResult.grandTotal,
      totalCost: calcResult.totalCost,
      profit: calcResult.profit,
      createdBy: userId,
      maturityDays: dto.maturityDays || 0,
      paymentType: dto.paymentType || 'NAKİT',
      installments: dto.installments || 1,
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

    // Dynamic Installment rows generation if paymentType is VADELİ or installments > 1
    if (savedSale.paymentType === 'VADELİ' || savedSale.installments > 1) {
      const totalToPay = calcResult.grandTotal;
      const n = savedSale.installments && savedSale.installments > 0 ? savedSale.installments : 1;
      const installmentBase = totalToPay.div(n).toDecimalPlaces(2, Decimal.ROUND_DOWN);
      let totalAssigned = new Decimal(0);
      
      const installmentEntities = [];
      const baseDate = new Date();
      
      for (let i = 1; i <= n; i++) {
        let amt = installmentBase;
        if (i === n) {
          amt = totalToPay.minus(totalAssigned);
        } else {
          totalAssigned = totalAssigned.add(installmentBase);
        }
        
        const dueDate = new Date(baseDate);
        dueDate.setDate(baseDate.getDate() + (i * 30));
        const formattedDueDate = dueDate.toISOString().split('T')[0];
        
        installmentEntities.push(manager.create(SaleInstallment, {
          saleId: savedSale.id,
          installmentNo: i,
          dueDate: formattedDueDate,
          amount: amt,
          paymentStatus: 'pasif',
          createdBy: userId
        }));
      }
      await manager.save(SaleInstallment, installmentEntities);
    }

    // Task 4: Process deposit immediately upon draft creation
    await this.processSaleDeposit(
      manager,
      savedSale,
      party,
      depositAmount,
      dto.commercialAccountId,
      userId
    );
    await manager.save(Party, party);

    // Deduct stock from virtual warehouse (sanaldepo) upon draft creation
    const sanalDept = await manager.query(
      "SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1"
    );
    const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';

    const itemsToDeduct = calcResult.lines.map(line => ({
      itemId: line.itemId,
      quantity: line.quantity
    }));

    await this.stocksService.finalizeShipmentBulk(
      itemsToDeduct,
      sanalDeptId,
      manager,
      {
        type: 'sale',
        id: savedSale.id,
        description: `Sanal Stok Satış Düşüşü: ${savedSale.code}`
      },
      userId
    );

    await manager.save(Sale, savedSale);

    return this.reportsService.findOne(savedSale.id, manager);
  }

  @Transactional()
  async update(id: string, dto: UpdateSaleDto, userId: string, user?: JwtPayload): Promise<Sale> {
    const manager = this.transactionContext.manager;
    const sale = await this.reportsService.findOne(id, manager);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dto.deliveryDate && dto.deliveryDate < todayStr) {
      throw new BadRequestException('Teslimat tarihi bugünden önceki bir tarih olamaz.');
    }

    if (user && !user.isSystemAdmin && !user.permissions?.includes('SALES_EDIT_ALL')) {
      if (sale.createdBy !== String(user.sub)) {
        throw new ForbiddenException('Sadece kendi oluşturduğunuz satış siparişlerini düzenleyebilirsiniz.');
      }
    }

    const updatableFields: (keyof UpdateSaleDto)[] = [
      'notes', 'deliveryDate', 'staffId', 'phone', 'address', 'taxNumber',
      'email', 'source', 'city', 'district', 'commercialAccountId',
      'maturityDays', 'paymentType', 'installments', 'saleTypeId'
    ];
    updatableFields.forEach(field => {
      if (dto[field] !== undefined) (sale as unknown as Record<string, unknown>)[field] = dto[field];
    });
    sale.updatedBy = userId || null;

    if (dto.items && dto.items.length > 0) {
      // Satış tipi değişikliğini dinamik olarak yakala
      const targetSaleTypeId = dto.saleTypeId || sale.saleTypeId;
      const currentSaleType = await manager.findOne(SaleType, { where: { id: targetSaleTypeId } });
      const isRetail = currentSaleType?.abbreviation === 'PRK';

      const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
      const calcResult = SaleCalculator.calculate(
        dto.items,
        itemDataMap,
        dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount,
        dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent,
        isRetail,
        dto.representativePrice !== undefined ? dto.representativePrice : sale.grandTotal
      );

      sale.totalAmount = calcResult.totalAmount;
      sale.discountAmount = calcResult.discountAmount;
      sale.discountPercent = calcResult.discountPercent;
      sale.kdv = calcResult.kdv;
      sale.grandTotal = calcResult.grandTotal;
      sale.totalCost = calcResult.totalCost;
      sale.profit = calcResult.profit;
      if (dto.deposit !== undefined) sale.deposit = new Decimal(dto.deposit);

      // Revert the old items from sanaldepo
      const sanalDept = await manager.query(
        "SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1"
      );
      const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';

      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          await this.stocksService.increaseStock(
            item.itemId,
            sanalDeptId,
            item.quantity,
            item.costPrice || 0,
            manager,
            {
              type: 'revert',
              id: sale.id,
              description: `Sanal Stok Satış Güncelleme İadesi: ${sale.code}`
            },
            userId
          );
        }
      }

      await manager.delete(SaleItem, { saleId: sale.id });
      const saleItemEntities = calcResult.lines.map(line => manager.create(SaleItem, {
        ...line,
        saleId: sale.id,
        costPrice: line.costPrice,
        updatedBy: userId
      }));
      await manager.save(SaleItem, saleItemEntities);

      // Deduct the new items from sanaldepo
      const itemsToDeduct = calcResult.lines.map(line => ({
        itemId: line.itemId,
        quantity: line.quantity
      }));
      await this.stocksService.finalizeShipmentBulk(
        itemsToDeduct,
        sanalDeptId,
        manager,
        {
          type: 'sale',
          id: sale.id,
          description: `Sanal Stok Satış Düşüşü (Güncelleme): ${sale.code}`
        },
        userId
      );
    } else if (dto.deposit !== undefined) {
      sale.deposit = new Decimal(dto.deposit);
    }

    if (sale.deposit.gt(sale.grandTotal)) {
      throw new BadRequestException('Kapora tutarı toplam satış tutarından büyük olamaz.');
    }

    const party = await manager.findOne(Party, { where: { id: sale.partyId }, lock: { mode: 'pessimistic_write' } });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');

    await this.processSaleDeposit(
      manager,
      sale,
      party,
      sale.deposit,
      sale.commercialAccountId,
      userId
    );
    await manager.save(Party, party);

    await manager.save(sale);

    // Delete existing installments and recreate them if any financial/installment field changes
    const shouldRecreateInstallments = 
      dto.items !== undefined || 
      dto.installments !== undefined || 
      dto.maturityDays !== undefined || 
      dto.paymentType !== undefined ||
      dto.discountAmount !== undefined ||
      dto.discountPercent !== undefined ||
      dto.deposit !== undefined;

    if (shouldRecreateInstallments) {
      await manager.delete(SaleInstallment, { saleId: sale.id });
      if (sale.paymentType === 'VADELİ' || sale.installments > 1) {
        const totalToPay = new Decimal(sale.grandTotal);
        const n = sale.installments && sale.installments > 0 ? sale.installments : 1;
        const installmentBase = totalToPay.div(n).toDecimalPlaces(2, Decimal.ROUND_DOWN);
        let totalAssigned = new Decimal(0);
        
        const installmentEntities = [];
        const baseDate = new Date(sale.createdAt || new Date());
        
        for (let i = 1; i <= n; i++) {
          let amt = installmentBase;
          if (i === n) {
            amt = totalToPay.minus(totalAssigned);
          } else {
            totalAssigned = totalAssigned.add(installmentBase);
          }
          
          const dueDate = new Date(baseDate);
          dueDate.setDate(baseDate.getDate() + (i * 30));
          const formattedDueDate = dueDate.toISOString().split('T')[0];
          
          installmentEntities.push(manager.create(SaleInstallment, {
            saleId: sale.id,
            installmentNo: i,
            dueDate: formattedDueDate,
            amount: amt,
            paymentStatus: 'pasif',
            updatedBy: userId
          }));
        }
        await manager.save(SaleInstallment, installmentEntities);
      }
    }

    return this.reportsService.findOne(id, manager);
  }

  @Transactional()
  async approveSale(saleId: string, dto: ApproveSaleDto, userId: string, user?: JwtPayload): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'draft') throw new BadRequestException('Sadece taslak durumundaki siparişler onaylanabilir.');

    const todayStr = new Date().toISOString().split('T')[0];
    if (sale.deliveryDate && sale.deliveryDate < todayStr) {
      throw new BadRequestException('Teslimat tarihi bugünden önceki bir tarih olamaz.');
    }

    const party = await manager.findOne(Party, {
      where: { id: sale.partyId },
      lock: { mode: 'pessimistic_write' }
    });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');

    const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);
    const depositToTL = FH.mul(sale.deposit, sale.exchangeRate);

    // Granular permissions check for discount and credit limit
    const permissions = user?.permissions || [];
    const isSystemAdmin = user?.isSystemAdmin;

    const hasDiscount = new Decimal(sale.discountAmount || 0).gt(0) || new Decimal(sale.discountPercent || 0).gt(0);
    if (hasDiscount && !isSystemAdmin && !permissions.includes('SALES_APPROVE_DISCOUNT')) {
      throw new BadRequestException('İskontolu satışları onaylamak için yetkiniz bulunmamaktadır.');
    }

    const creditLimit = new Decimal(party.creditLimit || 0);
    const balance = new Decimal(party.balance || 0);
    if (creditLimit.gt(0) && balance.add(tlGrandTotal).gt(creditLimit)) {
      if (!isSystemAdmin && !permissions.includes('SALES_APPROVE_OVER_LIMIT')) {
        throw new BadRequestException(`Cari limit aşıldı! Sipariş sonrası bakiye (${balance.add(tlGrandTotal).toFixed(2)}) kredi limitini (${creditLimit.toFixed(2)}) aşmaktadır. Limit aşım onayı vermeye yetkiniz bulunmamaktadır.`);
      }
    }

    // Validate that the chosen departmentId is not the virtual/sanaldepo placeholder
    if (dto.departmentId) {
      const selectedDept = await manager.query(
        "SELECT name FROM departments WHERE id = ? LIMIT 1",
        [dto.departmentId]
      );
      if (selectedDept && selectedDept.length > 0) {
        const deptName = selectedDept[0].name.toLowerCase();
        if (deptName === 'sanaldepo' || deptName === 'satisdepo') {
          throw new BadRequestException("Çıkış deposu (stokların düşüleceği depo) olarak 'sanaldepo' veya 'satisdepo' seçilemez. Lütfen geçerli bir fiziksel depo seçiniz.");
        }
      }
    }

    sale.status = 'approved';
    const outgoingDeptId = dto.departmentId || sale.departmentId || (dto.items && dto.items[0]?.departmentId) || '1';
    sale.departmentId = outgoingDeptId;
    if (dto.commercialAccountId) {
      sale.commercialAccountId = dto.commercialAccountId;
    }
    sale.updatedBy = userId || null;

    // 1. Reserve stock on physical warehouses
    if (dto.items && dto.items.length > 0) {
      // Group items by departmentId
      const deptGroups = new Map<string, Array<{ itemId: string; quantity: number }>>();
      for (const item of dto.items) {
        const list = deptGroups.get(item.departmentId) || [];
        list.push({ itemId: item.itemId, quantity: item.quantity });
        deptGroups.set(item.departmentId, list);
      }

      for (const [deptId, items] of deptGroups.entries()) {
        await this.stocksService.reserveStockBulk(
          items,
          deptId,
          manager,
          {
            type: 'sale',
            id: sale.id,
            description: `Sipariş Rezervasyonu: ${sale.code}`
          },
          userId
        );
      }
    } else {
      const itemsToReserve = sale.items.map(item => ({
        itemId: String(item.itemId),
        quantity: new Decimal(item.quantity).toNumber()
      }));
      await this.stocksService.reserveStockBulk(
        itemsToReserve,
        outgoingDeptId,
        manager,
        {
          type: 'sale',
          id: sale.id,
          description: `Sipariş Rezervasyonu: ${sale.code}`
        },
        userId
      );
    }

    // 2. Billing: Debit Party
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

    // 3. Deposit: Register transaction and update party balance / sale paidAmount (if not already registered)
    const deposit = new Decimal(sale.deposit || 0);
    const commAccountId = dto.commercialAccountId || sale.commercialAccountId;

    const existingDepositTx = await manager.findOne(Transaction, {
      where: { referenceId: sale.id, referenceType: 'sale_deposit', status: 'completed' }
    });

    if (!existingDepositTx && commAccountId && deposit.gt(0)) {
      const tlDeposit = FH.mul(deposit, sale.exchangeRate);
      const txCode = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');
      
      const tx = manager.create(Transaction, {
        code: txCode, 
        partyId: party.id, 
        commercialAccountId: String(commAccountId),
        amount: deposit, 
        currencyId: sale.currencyId, 
        exchangeRate: sale.exchangeRate,
        type: 'in', 
        referenceType: 'sale_deposit', 
        referenceId: sale.id, 
        date: DateUtils.getToday(),
        description: `${sale.code} Nolu Satış Kaporası / Ön Ödemesi`, 
        status: 'completed', 
        createdBy: userId
      });
      const savedTx = await manager.save(tx);

      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        accountId: String(commAccountId),
        debit: new Decimal(0),
        credit: tlDeposit, 
        transactionId: savedTx.id,
        source: 'DEPOSIT',
        description: `${sale.code} Satış Kaporası`
      }));

      party.balance = FH.sub(party.balance, tlDeposit);
      sale.paidAmount = deposit;
    }

    party.updatedBy = userId || null;
    await manager.save(Party, party);
    await manager.save(Sale, sale);

    // 4. Create shipment record automatically
    const existingShipment = await manager.findOne(Shipment, {
      where: { saleId: sale.id }
    });

    if (!existingShipment) {
      const shipment = manager.create(Shipment, {
        saleId: sale.id,
        outgoingDepartmentId: outgoingDeptId,
        deliveryCity: sale.city || 'İstanbul',
        deliveryDistrict: sale.district || 'Merkez',
        deliveryAddress: sale.address || 'Adres belirtilmemiş',
        deadline: sale.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      });
      await manager.save(Shipment, shipment);
    }

    const plainSale = {
      id: sale.id,
      code: sale.code,
      partyId: sale.partyId,
      currencyId: sale.currencyId,
      exchangeRate: sale.exchangeRate?.toString() || '1',
      deposit: sale.deposit?.toString() || '0',
      grandTotal: sale.grandTotal?.toString() || '0',
      totalAmount: sale.totalAmount?.toString() || '0',
      status: sale.status,
      items: sale.items?.map(item => ({
        saleId: item.saleId,
        itemId: item.itemId,
        quantity: item.quantity?.toString() || '0',
        shippedQuantity: item.shippedQuantity?.toString() || '0',
        price: item.price?.toString() || '0',
        netPrice: item.netPrice?.toString() || '0',
        lineTotal: item.lineTotal?.toString() || '0',
        kdvRate: item.kdvRate?.toString() || '0',
        kdvAmount: item.kdvAmount?.toString() || '0',
      }))
    };

    await this.outboxService.saveEvent({
      topic: 'sale.approved',
      payload: {
        sale: plainSale as unknown as Record<string, unknown>,
        tlGrandTotal: tlGrandTotal.toString(),
        deposit: depositToTL.toString(),
        departmentId: dto.departmentId,
        commercialAccountId: dto.commercialAccountId || sale.commercialAccountId,
        userId,
        items: dto.items,
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
  async cancelSale(saleId: string, reason: string, userId: string): Promise<Sale> {
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

      const party = await manager.findOne(Party, { 
        where: { id: sale.partyId },
        lock: { mode: 'pessimistic_write' }
      });

      if (party) {
        // Revert billing: Credit Party
        await manager.save(manager.create(AccountingLedger, {
          date: DateUtils.getToday(),
          partyId: party.id,
          debit: new Decimal(0),
          credit: tlGrandTotal,
          transactionId: sale.id,
          source: 'CANCEL_SALE',
          description: `${sale.code} Satış İptali - Borç Revert`
        }));
        party.balance = FH.sub(party.balance, tlGrandTotal);

        // Revert deposit if it was paid
        const depositTx = await manager.findOne(Transaction, {
          where: { referenceId: sale.id, referenceType: 'sale_deposit', status: 'completed' }
        });

        if (depositTx) {
          const tlDepositActual = FH.mul(depositTx.amount, depositTx.exchangeRate);
          await manager.save(manager.create(AccountingLedger, {
            date: DateUtils.getToday(),
            partyId: party.id,
            accountId: depositTx.commercialAccountId,
            debit: tlDepositActual,
            credit: new Decimal(0),
            transactionId: sale.id,
            source: 'CANCEL_DEPOSIT',
            description: `${sale.code} Tahsilat İptali - Alacak Revert`
          }));
          
          depositTx.status = 'cancelled';
          depositTx.updatedBy = userId;
          await manager.save(Transaction, depositTx);

          party.balance = FH.add(party.balance, tlDepositActual);
        }

        const otherTxs = await manager.find(Transaction, {
          where: { referenceId: sale.id, referenceType: 'sale', status: 'completed' }
        });

        const ledgersToSave: AccountingLedger[] = [];
        const txsToUpdate: Transaction[] = [];

        for (const tx of otherTxs) {
          const tlTxActual = FH.mul(tx.amount, tx.exchangeRate);
          ledgersToSave.push(manager.create(AccountingLedger, {
            date: DateUtils.getToday(),
            partyId: party.id,
            accountId: tx.commercialAccountId,
            debit: tlTxActual,
            credit: new Decimal(0),
            transactionId: sale.id,
            source: 'CANCEL_PAYMENT',
            description: `${sale.code} Sevk Tahsilat İptali - Alacak Revert`
          }));

          tx.status = 'cancelled';
          tx.updatedBy = userId;
          txsToUpdate.push(tx);

          party.balance = FH.add(party.balance, tlTxActual);
        }

        if (ledgersToSave.length > 0) {
          await manager.save(AccountingLedger, ledgersToSave);
        }
        if (txsToUpdate.length > 0) {
          await manager.save(Transaction, txsToUpdate);
        }

        party.updatedBy = userId || null;
        await manager.save(Party, party);
      }

      // Revert virtual stock deduction
      await this.revertSanalDepoStock(manager, sale, userId);

      // Revert finalized physical shipments if any
      const shipments = await manager.find(Shipment, { where: { saleId: sale.id } });
      if (shipments.length > 0) {
        const shipmentIds = shipments.map(s => s.id);
        const movements = await manager.find(StockMovement, {
          where: { referenceType: 'shipment', referenceId: In(shipmentIds), type: 'out' },
          relations: ['stock']
        });

        for (const mov of movements) {
          if (mov.stock) {
            await this.stocksService.increaseStock(
              mov.stock.itemId,
              mov.stock.departmentId,
              mov.quantity,
              mov.unitCost || 0,
              manager,
              {
                type: 'revert',
                id: sale.id,
                description: `Satıştan iade. (Pasife Alındı)`
              },
              userId
            );
          }
        }

        const satisDept = await manager.query(
          "SELECT id FROM departments WHERE name = 'satisdepo' LIMIT 1"
        );
        const satisDeptId = (satisDept && satisDept.length > 0) ? String(satisDept[0].id) : null;
        if (satisDeptId) {
          for (const mov of movements) {
            if (mov.stock) {
              await this.stocksService.decreaseStock(
                mov.stock.itemId,
                satisDeptId,
                mov.quantity,
                manager,
                {
                  type: 'revert',
                  id: sale.id,
                  description: `Satıştan İptal/İade Düşümü (Pasife Alındı)`
                },
                userId
              );
            }
          }
        }
      }

      // Release reserved stock across all physical warehouses that held reservations for this sale
      const reservationMovements = await manager.find(StockMovement, {
        where: {
          referenceType: 'sale',
          referenceId: sale.id,
          description: Like('%Sipariş Rezervasyonu%'),
        },
        relations: ['stock'],
      });

      if (reservationMovements && reservationMovements.length > 0) {
        // Group by stock's departmentId
        const deptReleaseMap = new Map<string, Array<{ itemId: string; quantity: number }>>();
        for (const mov of reservationMovements) {
          if (mov.stock && mov.stock.departmentId && mov.stock.itemId) {
            const deptId = String(mov.stock.departmentId);
            const list = deptReleaseMap.get(deptId) || [];
            list.push({
              itemId: String(mov.stock.itemId),
              quantity: new Decimal(mov.quantity || 0).toNumber(),
            });
            deptReleaseMap.set(deptId, list);
          }
        }

        for (const [deptId, items] of deptReleaseMap.entries()) {
          await this.stocksService.releaseStockBulk(
            items,
            deptId,
            manager,
            {
              type: 'revert',
              id: sale.id,
              description: `Sipariş İptali Rezervasyon İadesi: ${sale.code}`,
            },
            userId
          );
        }
      } else if (sale.items && sale.items.length > 0 && sale.departmentId) {
        // Fallback for legacy sales
        const itemsToRelease = sale.items.map(item => ({
          itemId: String(item.itemId),
          quantity: new Decimal(item.quantity).toNumber()
        }));
        await this.stocksService.releaseStockBulk(
          itemsToRelease,
          sale.departmentId,
          manager,
          {
            type: 'revert',
            id: sale.id,
            description: `Sipariş İptali Rezervasyon İadesi: ${sale.code}`
          },
          userId
        );
      }
    } else if (previousStatus === 'draft') {
      // Revert deposit if it was paid
      const party = await manager.findOne(Party, { 
        where: { id: sale.partyId },
        lock: { mode: 'pessimistic_write' }
      });
      if (party) {
        await this.revertSaleDepositIfExists(manager, sale, party, userId);
        await manager.save(Party, party);
      }

      // Revert sanaldepo stock deduction
      await this.revertSanalDepoStock(manager, sale, userId);
    }

    await manager.update(Sale, sale.id, { 
      status: 'cancelled', 
      paidAmount: 0, 
      updatedBy: userId,
      cancelledById: userId,
      cancelledAt: new Date(),
      cancelReason: reason
    });
    
    // Also cancel any shipments associated with this sale
    await manager.update(Shipment, { saleId: sale.id }, { status: 'cancelled' });

    this.logsService.logActivity({
      userId,
      module: 'sales',
      action: 'CANCEL_SALE',
      tag: 'SUCCESS',
      details: `Satış iptal edildi: ${sale.code}, Sebeb: ${reason}`
    });

    return this.reportsService.findOne(saleId, manager);
  }

  @Transactional()
  async revertToDraft(saleId: string, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, {
      where: { id: saleId },
      relations: ['items', 'items.item']
    });
    if (!sale) throw new NotFoundException('Satış bulunamadı');
    if (sale.status !== 'approved') {
      throw new BadRequestException('Sadece onaylanmış siparişler taslağa geri döndürülebilir.');
    }

    // 1. Revert billing (Credit Party by tlGrandTotal)
    const tlGrandTotal = FH.mul(sale.grandTotal, sale.exchangeRate);
    const party = await manager.findOne(Party, {
      where: { id: sale.partyId },
      lock: { mode: 'pessimistic_write' }
    });

    if (party) {
      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        debit: new Decimal(0),
        credit: tlGrandTotal,
        transactionId: sale.id,
        source: 'REVERT_TO_DRAFT',
        description: `${sale.code} Satış Onay İptali (Taslağa Geri Dönüş) - Borç Revert`
      }));
      party.balance = FH.sub(party.balance, tlGrandTotal);
      party.updatedBy = userId || null;
      await manager.save(Party, party);
    }

    // 2. Release reserved physical stock
    if (sale.items && sale.items.length > 0 && sale.departmentId) {
      const itemsToRelease = sale.items.map(item => ({
        itemId: String(item.itemId),
        quantity: new Decimal(item.quantity).toNumber()
      }));
      await this.stocksService.releaseStockBulk(
        itemsToRelease,
        sale.departmentId,
        manager,
        {
          type: 'revert',
          id: sale.id,
          description: `${sale.code} Satış Onay İptali Rezervasyon İadesi`
        },
        userId
      );
    }

    // 3. Delete or cancel shipment record
    // Since it goes back to draft, delete the shipment if it exists and is pending
    const shipment = await manager.findOne(Shipment, {
      where: { saleId: sale.id }
    });
    if (shipment) {
      if (shipment.status !== 'pending') {
        throw new BadRequestException('Sevkiyatı başlanmış veya tamamlanmış siparişler taslağa döndürülemez.');
      }
      await manager.remove(Shipment, shipment);
    }

    // 4. Update status of the sale to draft
    sale.status = 'draft';
    sale.updatedBy = userId;
    await manager.save(Sale, sale);

    // Save outbox event
    const plainSale = {
      id: sale.id,
      code: sale.code,
      partyId: sale.partyId,
      currencyId: sale.currencyId,
      exchangeRate: sale.exchangeRate?.toString() || '1',
      deposit: sale.deposit?.toString() || '0',
      grandTotal: sale.grandTotal?.toString() || '0',
      totalAmount: sale.totalAmount?.toString() || '0',
      status: sale.status,
      items: sale.items?.map(item => ({
        saleId: item.saleId,
        itemId: item.itemId,
        quantity: item.quantity?.toString() || '0',
        shippedQuantity: item.shippedQuantity?.toString() || '0',
        price: item.price?.toString() || '0',
        netPrice: item.netPrice?.toString() || '0',
        lineTotal: item.lineTotal?.toString() || '0',
        kdvRate: item.kdvRate?.toString() || '0',
        kdvAmount: item.kdvAmount?.toString() || '0',
      }))
    };

    await this.outboxService.saveEvent({
      topic: 'sale.reverted_to_draft',
      payload: {
        sale: plainSale as unknown as Record<string, unknown>,
        userId,
      },
      manager,
    });

    this.logsService.logActivity({
      userId,
      module: 'sales',
      action: 'REVERT_TO_DRAFT',
      tag: 'SUCCESS',
      details: `Satış onay iptal edilerek taslağa döndürüldü: ${sale.code}`
    });

    return this.reportsService.findOne(saleId, manager);
  }

  @Transactional()
  async shipSale(saleId: string, dto: ShipSaleDto, userId: string): Promise<Sale> {
    const manager = this.transactionContext.manager;

    const sale = await manager.findOne(Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
    if (!sale) throw new NotFoundException('Satış bulunamadı');

    const party = await manager.findOne(Party, { 
      where: { id: sale.partyId },
      lock: { mode: 'pessimistic_write' }
    });
    if (!party) throw new NotFoundException('Cari hesap bulunamadı');

    if (dto.payments && dto.payments.length > 0) {
      const currency = sale.currencyId ? await manager.findOne(Currency, { where: { id: String(sale.currencyId) } }) : null;
      const exchangeRate = currency ? new Decimal(currency.exchangeRate) : new Decimal(1);

      for (const p of dto.payments) {
        const paymentAmount = new Decimal(p.amount);
        if (paymentAmount.lte(0)) continue;

        const tlAmount = FH.mul(paymentAmount, exchangeRate);
        const code = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');

        const tx = manager.create(Transaction, {
          code,
          partyId: party.id,
          commercialAccountId: String(p.commercialAccountId),
          amount: paymentAmount,
          currencyId: sale.currencyId || undefined,
          exchangeRate,
          type: 'in',
          referenceType: 'sale',
          referenceId: sale.id,
          date: DateUtils.getToday(),
          description: `Sipariş Sevk Tahsilatı (Kalan Tutar) - Sipariş No: ${sale.code}`,
          status: 'completed',
          createdBy: userId,
        });
        const savedTx = await manager.save(tx);

        const entryDebit = new Decimal(0);
        const entryCredit = tlAmount;
        await manager.save(manager.create(AccountingLedger, {
          date: DateUtils.getToday(),
          partyId: party.id,
          accountId: String(p.commercialAccountId),
          debit: entryDebit,
          credit: entryCredit,
          transactionId: savedTx.id,
          source: 'PAYMENT_IN',
          description: `Kasa Fişi: ${code}`
        }));

        party.balance = FH.sub(new Decimal(party.balance), tlAmount);
        sale.paidAmount = FH.add(new Decimal(sale.paidAmount || 0), paymentAmount);
      }

      await manager.save(Party, party);
      await manager.save(Sale, sale);
    }

    if (sale.paymentType !== 'VADELİ') {
      const paidAmount = new Decimal(sale.paidAmount || 0);
      const grandTotal = new Decimal(sale.grandTotal || 0);
      if (grandTotal.minus(paidAmount).abs().gt(0.01)) {
        throw new BadRequestException(
          `Bu siparişin ödemesi tam olarak kapatılmamıştır! ` +
          `Toplam Ödenen: ${paidAmount.toFixed(2)} ${sale.currency?.symbol || ''}, Toplam Tutar: ${grandTotal.toFixed(2)} ${sale.currency?.symbol || ''}. ` +
          `Siparişi sevk edebilmek için toplam ödemenin net satış tutarını karşılaması gerekmektedir.`
        );
      }
    }

    if (!sale.departmentId) throw new BadRequestException('Rezervasyon deposu bulunamadı.');

    const selectedDept = await manager.query(
      "SELECT name FROM departments WHERE id = ? LIMIT 1",
      [sale.departmentId]
    );
    if (selectedDept && selectedDept.length > 0) {
      const deptName = selectedDept[0].name.toLowerCase();
      if (deptName === 'sanaldepo' || deptName === 'satisdepo') {
        throw new BadRequestException("Rezervasyon deposu 'sanaldepo' veya 'satisdepo' olamaz. Lütfen geçerli bir fiziksel depo seçiniz.");
      }
    }

    const shipItems = dto.items || sale.items.map(i => ({ itemId: String(i.itemId), quantity: new Decimal(i.quantity).toNumber() }));

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

    // Task 6: Link vehicles and assigned staff to the Shipment record
    const shipment = await manager.findOne(Shipment, {
      where: { saleId: sale.id },
      relations: ['vehicles', 'assignedStaff']
    });
    if (!shipment) throw new NotFoundException('Sevkiyat kaydı bulunamadı.');

    if (dto.vehicleIds && dto.vehicleIds.length > 0) {
      shipment.vehicles = await manager.find(Vehicle, {
        where: { id: In(dto.vehicleIds) }
      });
    } else {
      shipment.vehicles = [];
    }

    if (dto.assignedStaffIds && dto.assignedStaffIds.length > 0) {
      shipment.assignedStaff = await manager.find(Staff, {
        where: { id: In(dto.assignedStaffIds) }
      });
    } else {
      shipment.assignedStaff = [];
    }

    shipment.status = 'shipped';
    shipment.approvedAt = new Date();
    await manager.save(Shipment, shipment);

    sale.status = 'shipped';
    sale.updatedBy = userId || null;
    await manager.save(Sale, sale);

    this.logsService.logActivity({
      userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
      details: `Sevkiyat yapıldı: ${sale.code}`
    });

    return this.reportsService.findOne(sale.id, manager);
  }

  private async processSaleDeposit(
    manager: EntityManager,
    sale: Sale,
    party: Party,
    depositAmount: Decimal,
    commAccountId: string | number | null | undefined,
    userId: string
  ) {
    // 1. Revert existing if any
    await this.revertSaleDepositIfExists(manager, sale, party, userId);

    // 2. Create new if deposit > 0 and commAccountId is provided
    if (depositAmount.gt(0) && commAccountId) {
      const tlDeposit = FH.mul(depositAmount, sale.exchangeRate);
      const txCode = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');

      const tx = manager.create(Transaction, {
        code: txCode,
        partyId: party.id,
        commercialAccountId: String(commAccountId),
        amount: depositAmount,
        currencyId: sale.currencyId,
        exchangeRate: sale.exchangeRate,
        type: 'in',
        referenceType: 'sale_deposit',
        referenceId: sale.id,
        date: DateUtils.getToday(),
        description: `${sale.code} Nolu Satış Kaporası / Ön Ödemesi`,
        status: 'completed',
        createdBy: userId,
      });
      const savedTx = await manager.save(tx);

      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        accountId: String(commAccountId),
        debit: new Decimal(0),
        credit: tlDeposit,
        transactionId: savedTx.id,
        source: 'DEPOSIT',
        description: `${sale.code} Satış Kaporası`
      }));

      party.balance = FH.sub(party.balance, tlDeposit);
      sale.paidAmount = depositAmount;
    } else {
      sale.paidAmount = new Decimal(0);
    }
  }

  private async revertSaleDepositIfExists(
    manager: EntityManager,
    sale: Sale,
    party: Party,
    userId: string
  ) {
    const depositTx = await manager.findOne(Transaction, {
      where: { referenceId: sale.id, referenceType: 'sale_deposit', status: 'completed' }
    });

    if (depositTx) {
      const tlDepositActual = FH.mul(depositTx.amount, depositTx.exchangeRate);

      // Post a ledger revert (debit party)
      await manager.save(manager.create(AccountingLedger, {
        date: DateUtils.getToday(),
        partyId: party.id,
        accountId: depositTx.commercialAccountId,
        debit: tlDepositActual,
        credit: new Decimal(0),
        transactionId: sale.id,
        source: 'CANCEL_DEPOSIT',
        description: `${sale.code} Tahsilat İptali - Alacak Revert`
      }));

      depositTx.status = 'cancelled';
      depositTx.updatedBy = userId;
      await manager.save(Transaction, depositTx);

      party.balance = FH.add(party.balance, tlDepositActual);
    }
  }

  @Transactional()
  async softDelete(id: string, userId: string, user?: JwtPayload): Promise<void> {
    const manager = this.transactionContext.manager;
    const sale = await this.reportsService.findOne(id, manager);
    if (sale.status !== 'draft') {
      throw new BadRequestException('Sadece taslak siparişler kalıcı silinebilir.');
    }

    if (user && !user.isSystemAdmin && !user.permissions?.includes('SALES_DELETE_ALL')) {
      if (sale.createdBy !== String(user.sub)) {
        throw new ForbiddenException('Sadece kendi oluşturduğunuz satış siparişlerini silebilirsiniz.');
      }
    }

    const party = await manager.findOne(Party, { where: { id: sale.partyId }, lock: { mode: 'pessimistic_write' } });
    if (party) {
      await this.revertSaleDepositIfExists(manager, sale, party, userId);
      await manager.save(Party, party);
    }

    // Revert sanaldepo stock deduction
    await this.revertSanalDepoStock(manager, sale, userId);

    await manager.softDelete(Sale, id);
  }

  private async revertSanalDepoStock(manager: EntityManager, sale: Sale, userId: string): Promise<void> {
    const sanalDept = await manager.query(
      "SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1"
    );
    const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';

    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        await this.stocksService.increaseStock(
          String(item.itemId),
          sanalDeptId,
          item.quantity,
          item.costPrice || 0,
          manager,
          {
            type: 'revert',
            id: sale.id,
            description: `Taslak İptal/Silme Sanal Stok İadesi: ${sale.code}`
          },
          userId
        );
      }
    }
  }
}
