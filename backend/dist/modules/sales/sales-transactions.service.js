"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SalesTransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const transactional_1 = require("@nestjs-cls/transactional");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_type_entity_1 = require("./entities/sale-type.entity");
const sale_installment_entity_1 = require("./entities/sale-installment.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const currency_entity_1 = require("../finance/currencies/entities/currency.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const staff_entity_1 = require("../staff/entities/staff.entity");
const vehicle_entity_1 = require("../inventory/stocks/entities/vehicle.entity");
const commercial_account_entity_1 = require("../finance/accounts/entities/commercial-account.entity");
const ledger_entity_1 = require("../parties/entities/ledger.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const sale_dto_1 = require("./dto/sale.dto");
const stock_movement_entity_1 = require("../inventory/stocks/entities/stock-movement.entity");
const shipment_entity_1 = require("../inventory/stocks/entities/shipment.entity");
const stocks_service_1 = require("../inventory/stocks/stocks.service");
const logs_service_1 = require("../logs/logs.service");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
const transaction_context_service_1 = require("../../common/services/transaction-context.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const sales_reports_service_1 = require("./sales-reports.service");
const sale_calculator_1 = require("./domain/sale-calculator");
const finance_helper_1 = require("../../common/utils/finance.helper");
const date_utils_1 = require("../../common/utils/date.utils");
let SalesTransactionsService = SalesTransactionsService_1 = class SalesTransactionsService {
    constructor(saleRepo, saleItemRepo, saleTypeRepo, sequenceGenerator, stocksService, logsService, transactionContext, outboxService, reportsService) {
        this.saleRepo = saleRepo;
        this.saleItemRepo = saleItemRepo;
        this.saleTypeRepo = saleTypeRepo;
        this.sequenceGenerator = sequenceGenerator;
        this.stocksService = stocksService;
        this.logsService = logsService;
        this.transactionContext = transactionContext;
        this.outboxService = outboxService;
        this.reportsService = reportsService;
        this.logger = new common_1.Logger(SalesTransactionsService_1.name);
    }
    async createSaleType(dto, userId) {
        const type = new sale_type_entity_1.SaleType();
        type.name = dto.name;
        type.abbreviation = dto.abbreviation;
        type.createdBy = userId ?? null;
        return this.saleTypeRepo.save(type);
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        const party = await manager.findOne(party_entity_1.Party, { where: { id: dto.partyId }, lock: { mode: 'pessimistic_write' } });
        if (!party)
            throw new common_1.NotFoundException('Cari bulunamadı.');
        if (party.state === 0)
            throw new common_1.BadRequestException('Pasif durumdaki bir cariye işlem yapılamaz.');
        const saleType = await manager.findOne(sale_type_entity_1.SaleType, { where: { id: dto.saleTypeId } });
        if (!saleType)
            throw new common_1.NotFoundException('Satış tipi bulunamadı.');
        const currency = await manager.findOne(currency_entity_1.Currency, { where: { id: dto.currencyId || "1" } });
        if (!currency)
            throw new common_1.NotFoundException('Döviz birimi bulunamadı.');
        const currentExchangeRate = currency.exchangeRate || new decimal_js_1.Decimal(1);
        if (dto.staffId) {
            const staffExists = await manager.count(staff_entity_1.Staff, { where: { id: dto.staffId } });
            if (staffExists === 0)
                throw new common_1.NotFoundException('Satış temsilcisi bulunamadı.');
        }
        if (dto.commercialAccountId) {
            const accountExists = await manager.count(commercial_account_entity_1.CommercialAccount, { where: { id: dto.commercialAccountId } });
            if (accountExists === 0)
                throw new common_1.NotFoundException('Ticari hesap bulunamadı.');
        }
        const user = await manager.findOne(user_entity_1.User, { where: { id: userId } });
        const userDeptId = user?.departmentId || 1;
        const code = await this.sequenceGenerator.generateSaleCode(manager, String(userDeptId));
        const isRetail = saleType.abbreviation === 'PRK';
        const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
        const calcResult = sale_calculator_1.SaleCalculator.calculate(dto.items, itemDataMap, dto.discountAmount, dto.discountPercent, isRetail, dto.representativePrice);
        const depositAmount = new decimal_js_1.Decimal(dto.deposit || 0);
        if (depositAmount.gt(calcResult.grandTotal)) {
            throw new common_1.BadRequestException('Kapora tutarı toplam satış tutarından büyük olamaz.');
        }
        const todayStr = new Date().toISOString().split('T')[0];
        if (dto.deliveryDate && dto.deliveryDate < todayStr) {
            throw new common_1.BadRequestException('Teslimat tarihi bugünden önceki bir tarih olamaz.');
        }
        const { items: _dtoItems, ...saleFields } = dto;
        const sale = manager.create(sale_entity_1.Sale, {
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
        const saleItemEntities = calcResult.lines.map(line => manager.create(sale_item_entity_1.SaleItem, {
            ...line,
            saleId: savedSale.id,
            shippedQuantity: new decimal_js_1.Decimal(0),
            costPrice: line.costPrice,
            createdBy: userId
        }));
        await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
        if (savedSale.paymentType === 'VADELİ' || savedSale.installments > 1) {
            const totalToPay = calcResult.grandTotal;
            const n = savedSale.installments && savedSale.installments > 0 ? savedSale.installments : 1;
            const installmentBase = totalToPay.div(n).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_DOWN);
            let totalAssigned = new decimal_js_1.Decimal(0);
            const installmentEntities = [];
            const baseDate = new Date();
            for (let i = 1; i <= n; i++) {
                let amt = installmentBase;
                if (i === n) {
                    amt = totalToPay.minus(totalAssigned);
                }
                else {
                    totalAssigned = totalAssigned.add(installmentBase);
                }
                const dueDate = new Date(baseDate);
                dueDate.setDate(baseDate.getDate() + (i * 30));
                const formattedDueDate = dueDate.toISOString().split('T')[0];
                installmentEntities.push(manager.create(sale_installment_entity_1.SaleInstallment, {
                    saleId: savedSale.id,
                    installmentNo: i,
                    dueDate: formattedDueDate,
                    amount: amt,
                    paymentStatus: 'pasif',
                    createdBy: userId
                }));
            }
            await manager.save(sale_installment_entity_1.SaleInstallment, installmentEntities);
        }
        await this.processSaleDeposit(manager, savedSale, party, depositAmount, dto.commercialAccountId, userId);
        await manager.save(party_entity_1.Party, party);
        const sanalDept = await manager.query("SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1");
        const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';
        const itemsToDeduct = calcResult.lines.map(line => ({
            itemId: line.itemId,
            quantity: line.quantity
        }));
        await this.stocksService.finalizeShipmentBulk(itemsToDeduct, sanalDeptId, manager, {
            type: 'sale',
            id: savedSale.id,
            description: `Sanal Stok Satış Düşüşü: ${savedSale.code}`
        }, userId);
        await manager.save(sale_entity_1.Sale, savedSale);
        return this.reportsService.findOne(savedSale.id, manager);
    }
    async update(id, dto, userId, user) {
        const manager = this.transactionContext.manager;
        const sale = await this.reportsService.findOne(id, manager);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
        }
        const todayStr = new Date().toISOString().split('T')[0];
        if (dto.deliveryDate && dto.deliveryDate < todayStr) {
            throw new common_1.BadRequestException('Teslimat tarihi bugünden önceki bir tarih olamaz.');
        }
        if (user && !user.isSystemAdmin && !user.permissions?.includes('SALES_EDIT_ALL')) {
            if (sale.createdBy !== String(user.sub)) {
                throw new common_1.ForbiddenException('Sadece kendi oluşturduğunuz satış siparişlerini düzenleyebilirsiniz.');
            }
        }
        const updatableFields = [
            'notes', 'deliveryDate', 'staffId', 'phone', 'address', 'taxNumber',
            'email', 'source', 'city', 'district', 'commercialAccountId',
            'maturityDays', 'paymentType', 'installments', 'saleTypeId'
        ];
        updatableFields.forEach(field => {
            if (dto[field] !== undefined)
                sale[field] = dto[field];
        });
        sale.updatedBy = userId || null;
        if (dto.items && dto.items.length > 0) {
            const targetSaleTypeId = dto.saleTypeId || sale.saleTypeId;
            const currentSaleType = await manager.findOne(sale_type_entity_1.SaleType, { where: { id: targetSaleTypeId } });
            const isRetail = currentSaleType?.abbreviation === 'PRK';
            const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
            const calcResult = sale_calculator_1.SaleCalculator.calculate(dto.items, itemDataMap, dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount, dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent, isRetail, dto.representativePrice !== undefined ? dto.representativePrice : sale.grandTotal);
            sale.totalAmount = calcResult.totalAmount;
            sale.discountAmount = calcResult.discountAmount;
            sale.discountPercent = calcResult.discountPercent;
            sale.kdv = calcResult.kdv;
            sale.grandTotal = calcResult.grandTotal;
            sale.totalCost = calcResult.totalCost;
            sale.profit = calcResult.profit;
            if (dto.deposit !== undefined)
                sale.deposit = new decimal_js_1.Decimal(dto.deposit);
            const sanalDept = await manager.query("SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1");
            const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';
            if (sale.items && sale.items.length > 0) {
                for (const item of sale.items) {
                    await this.stocksService.increaseStock(item.itemId, sanalDeptId, item.quantity, item.costPrice || 0, manager, {
                        type: 'revert',
                        id: sale.id,
                        description: `Sanal Stok Satış Güncelleme İadesi: ${sale.code}`
                    }, userId);
                }
            }
            await manager.delete(sale_item_entity_1.SaleItem, { saleId: sale.id });
            const saleItemEntities = calcResult.lines.map(line => manager.create(sale_item_entity_1.SaleItem, {
                ...line,
                saleId: sale.id,
                costPrice: line.costPrice,
                updatedBy: userId
            }));
            await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
            const itemsToDeduct = calcResult.lines.map(line => ({
                itemId: line.itemId,
                quantity: line.quantity
            }));
            await this.stocksService.finalizeShipmentBulk(itemsToDeduct, sanalDeptId, manager, {
                type: 'sale',
                id: sale.id,
                description: `Sanal Stok Satış Düşüşü (Güncelleme): ${sale.code}`
            }, userId);
        }
        else if (dto.deposit !== undefined) {
            sale.deposit = new decimal_js_1.Decimal(dto.deposit);
        }
        if (sale.deposit.gt(sale.grandTotal)) {
            throw new common_1.BadRequestException('Kapora tutarı toplam satış tutarından büyük olamaz.');
        }
        const party = await manager.findOne(party_entity_1.Party, { where: { id: sale.partyId }, lock: { mode: 'pessimistic_write' } });
        if (!party)
            throw new common_1.NotFoundException('Cari hesap bulunamadı');
        await this.processSaleDeposit(manager, sale, party, sale.deposit, sale.commercialAccountId, userId);
        await manager.save(party_entity_1.Party, party);
        await manager.save(sale);
        const shouldRecreateInstallments = dto.items !== undefined ||
            dto.installments !== undefined ||
            dto.maturityDays !== undefined ||
            dto.paymentType !== undefined ||
            dto.discountAmount !== undefined ||
            dto.discountPercent !== undefined ||
            dto.deposit !== undefined;
        if (shouldRecreateInstallments) {
            await manager.delete(sale_installment_entity_1.SaleInstallment, { saleId: sale.id });
            if (sale.paymentType === 'VADELİ' || sale.installments > 1) {
                const totalToPay = new decimal_js_1.Decimal(sale.grandTotal);
                const n = sale.installments && sale.installments > 0 ? sale.installments : 1;
                const installmentBase = totalToPay.div(n).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_DOWN);
                let totalAssigned = new decimal_js_1.Decimal(0);
                const installmentEntities = [];
                const baseDate = new Date(sale.createdAt || new Date());
                for (let i = 1; i <= n; i++) {
                    let amt = installmentBase;
                    if (i === n) {
                        amt = totalToPay.minus(totalAssigned);
                    }
                    else {
                        totalAssigned = totalAssigned.add(installmentBase);
                    }
                    const dueDate = new Date(baseDate);
                    dueDate.setDate(baseDate.getDate() + (i * 30));
                    const formattedDueDate = dueDate.toISOString().split('T')[0];
                    installmentEntities.push(manager.create(sale_installment_entity_1.SaleInstallment, {
                        saleId: sale.id,
                        installmentNo: i,
                        dueDate: formattedDueDate,
                        amount: amt,
                        paymentStatus: 'pasif',
                        updatedBy: userId
                    }));
                }
                await manager.save(sale_installment_entity_1.SaleInstallment, installmentEntities);
            }
        }
        return this.reportsService.findOne(id, manager);
    }
    async approveSale(saleId, dto, userId, user) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        if (sale.status !== 'draft')
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler onaylanabilir.');
        const todayStr = new Date().toISOString().split('T')[0];
        if (sale.deliveryDate && sale.deliveryDate < todayStr) {
            throw new common_1.BadRequestException('Teslimat tarihi bugünden önceki bir tarih olamaz.');
        }
        const party = await manager.findOne(party_entity_1.Party, {
            where: { id: sale.partyId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!party)
            throw new common_1.NotFoundException('Cari hesap bulunamadı');
        const tlGrandTotal = finance_helper_1.FinanceHelper.mul(sale.grandTotal, sale.exchangeRate);
        const depositToTL = finance_helper_1.FinanceHelper.mul(sale.deposit, sale.exchangeRate);
        const permissions = user?.permissions || [];
        const isSystemAdmin = user?.isSystemAdmin;
        const hasDiscount = new decimal_js_1.Decimal(sale.discountAmount || 0).gt(0) || new decimal_js_1.Decimal(sale.discountPercent || 0).gt(0);
        if (hasDiscount && !isSystemAdmin && !permissions.includes('SALES_APPROVE_DISCOUNT')) {
            throw new common_1.BadRequestException('İskontolu satışları onaylamak için yetkiniz bulunmamaktadır.');
        }
        const creditLimit = new decimal_js_1.Decimal(party.creditLimit || 0);
        const balance = new decimal_js_1.Decimal(party.balance || 0);
        if (creditLimit.gt(0) && balance.add(tlGrandTotal).gt(creditLimit)) {
            if (!isSystemAdmin && !permissions.includes('SALES_APPROVE_OVER_LIMIT')) {
                throw new common_1.BadRequestException(`Cari limit aşıldı! Sipariş sonrası bakiye (${balance.add(tlGrandTotal).toFixed(2)}) kredi limitini (${creditLimit.toFixed(2)}) aşmaktadır. Limit aşım onayı vermeye yetkiniz bulunmamaktadır.`);
            }
        }
        if (dto.departmentId) {
            const selectedDept = await manager.query("SELECT name FROM departments WHERE id = ? LIMIT 1", [dto.departmentId]);
            if (selectedDept && selectedDept.length > 0) {
                const deptName = selectedDept[0].name.toLowerCase();
                if (deptName === 'sanaldepo' || deptName === 'satisdepo') {
                    throw new common_1.BadRequestException("Çıkış deposu (stokların düşüleceği depo) olarak 'sanaldepo' veya 'satisdepo' seçilemez. Lütfen geçerli bir fiziksel depo seçiniz.");
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
        if (dto.items && dto.items.length > 0) {
            const deptGroups = new Map();
            for (const item of dto.items) {
                const list = deptGroups.get(item.departmentId) || [];
                list.push({ itemId: item.itemId, quantity: item.quantity });
                deptGroups.set(item.departmentId, list);
            }
            for (const [deptId, items] of deptGroups.entries()) {
                await this.stocksService.reserveStockBulk(items, deptId, manager, {
                    type: 'sale',
                    id: sale.id,
                    description: `Sipariş Rezervasyonu: ${sale.code}`
                }, userId);
            }
        }
        else {
            const itemsToReserve = sale.items.map(item => ({
                itemId: String(item.itemId),
                quantity: new decimal_js_1.Decimal(item.quantity).toNumber()
            }));
            await this.stocksService.reserveStockBulk(itemsToReserve, outgoingDeptId, manager, {
                type: 'sale',
                id: sale.id,
                description: `Sipariş Rezervasyonu: ${sale.code}`
            }, userId);
        }
        await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
            date: date_utils_1.DateUtils.getToday(),
            partyId: sale.partyId,
            debit: tlGrandTotal,
            credit: new decimal_js_1.Decimal(0),
            transactionId: sale.id,
            source: 'SALE',
            description: `${sale.code} numaralı Satış Faturası Borçlandırması`
        }));
        party.balance = finance_helper_1.FinanceHelper.add(party.balance, tlGrandTotal);
        const deposit = new decimal_js_1.Decimal(sale.deposit || 0);
        const commAccountId = dto.commercialAccountId || sale.commercialAccountId;
        const existingDepositTx = await manager.findOne(transaction_entity_1.Transaction, {
            where: { referenceId: sale.id, referenceType: 'sale_deposit', status: 'completed' }
        });
        if (!existingDepositTx && commAccountId && deposit.gt(0)) {
            const tlDeposit = finance_helper_1.FinanceHelper.mul(deposit, sale.exchangeRate);
            const txCode = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');
            const tx = manager.create(transaction_entity_1.Transaction, {
                code: txCode,
                partyId: party.id,
                commercialAccountId: String(commAccountId),
                amount: deposit,
                currencyId: sale.currencyId,
                exchangeRate: sale.exchangeRate,
                type: 'in',
                referenceType: 'sale_deposit',
                referenceId: sale.id,
                date: date_utils_1.DateUtils.getToday(),
                description: `${sale.code} Nolu Satış Kaporası / Ön Ödemesi`,
                status: 'completed',
                createdBy: userId
            });
            const savedTx = await manager.save(tx);
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                accountId: String(commAccountId),
                debit: new decimal_js_1.Decimal(0),
                credit: tlDeposit,
                transactionId: savedTx.id,
                source: 'DEPOSIT',
                description: `${sale.code} Satış Kaporası`
            }));
            party.balance = finance_helper_1.FinanceHelper.sub(party.balance, tlDeposit);
            sale.paidAmount = deposit;
        }
        party.updatedBy = userId || null;
        await manager.save(party_entity_1.Party, party);
        await manager.save(sale_entity_1.Sale, sale);
        const existingShipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { saleId: sale.id }
        });
        if (!existingShipment) {
            const shipment = manager.create(shipment_entity_1.Shipment, {
                saleId: sale.id,
                outgoingDepartmentId: outgoingDeptId,
                deliveryCity: sale.city || 'İstanbul',
                deliveryDistrict: sale.district || 'Merkez',
                deliveryAddress: sale.address || 'Adres belirtilmemiş',
                deadline: sale.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending'
            });
            await manager.save(shipment_entity_1.Shipment, shipment);
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
                sale: plainSale,
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
    async cancelSale(saleId, reason, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, {
            where: { id: saleId },
            relations: ['items', 'items.item']
        });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        if (sale.status === 'cancelled')
            throw new common_1.BadRequestException('Sipariş zaten iptal edilmiş.');
        const previousStatus = sale.status;
        if (previousStatus === 'approved' || previousStatus === 'shipped') {
            const tlGrandTotal = finance_helper_1.FinanceHelper.mul(sale.grandTotal, sale.exchangeRate);
            const tlDeposit = finance_helper_1.FinanceHelper.mul(sale.deposit, sale.exchangeRate);
            const party = await manager.findOne(party_entity_1.Party, {
                where: { id: sale.partyId },
                lock: { mode: 'pessimistic_write' }
            });
            if (party) {
                await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                    date: date_utils_1.DateUtils.getToday(),
                    partyId: party.id,
                    debit: new decimal_js_1.Decimal(0),
                    credit: tlGrandTotal,
                    transactionId: sale.id,
                    source: 'CANCEL_SALE',
                    description: `${sale.code} Satış İptali - Borç Revert`
                }));
                party.balance = finance_helper_1.FinanceHelper.sub(party.balance, tlGrandTotal);
                const depositTx = await manager.findOne(transaction_entity_1.Transaction, {
                    where: { referenceId: sale.id, referenceType: 'sale_deposit', status: 'completed' }
                });
                if (depositTx) {
                    const tlDepositActual = finance_helper_1.FinanceHelper.mul(depositTx.amount, depositTx.exchangeRate);
                    await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                        date: date_utils_1.DateUtils.getToday(),
                        partyId: party.id,
                        accountId: depositTx.commercialAccountId,
                        debit: tlDepositActual,
                        credit: new decimal_js_1.Decimal(0),
                        transactionId: sale.id,
                        source: 'CANCEL_DEPOSIT',
                        description: `${sale.code} Tahsilat İptali - Alacak Revert`
                    }));
                    depositTx.status = 'cancelled';
                    depositTx.updatedBy = userId;
                    await manager.save(transaction_entity_1.Transaction, depositTx);
                    party.balance = finance_helper_1.FinanceHelper.add(party.balance, tlDepositActual);
                }
                const otherTxs = await manager.find(transaction_entity_1.Transaction, {
                    where: { referenceId: sale.id, referenceType: 'sale', status: 'completed' }
                });
                const ledgersToSave = [];
                const txsToUpdate = [];
                for (const tx of otherTxs) {
                    const tlTxActual = finance_helper_1.FinanceHelper.mul(tx.amount, tx.exchangeRate);
                    ledgersToSave.push(manager.create(ledger_entity_1.AccountingLedger, {
                        date: date_utils_1.DateUtils.getToday(),
                        partyId: party.id,
                        accountId: tx.commercialAccountId,
                        debit: tlTxActual,
                        credit: new decimal_js_1.Decimal(0),
                        transactionId: sale.id,
                        source: 'CANCEL_PAYMENT',
                        description: `${sale.code} Sevk Tahsilat İptali - Alacak Revert`
                    }));
                    tx.status = 'cancelled';
                    tx.updatedBy = userId;
                    txsToUpdate.push(tx);
                    party.balance = finance_helper_1.FinanceHelper.add(party.balance, tlTxActual);
                }
                if (ledgersToSave.length > 0) {
                    await manager.save(ledger_entity_1.AccountingLedger, ledgersToSave);
                }
                if (txsToUpdate.length > 0) {
                    await manager.save(transaction_entity_1.Transaction, txsToUpdate);
                }
                party.updatedBy = userId || null;
                await manager.save(party_entity_1.Party, party);
            }
            await this.revertSanalDepoStock(manager, sale, userId);
            const shipments = await manager.find(shipment_entity_1.Shipment, { where: { saleId: sale.id } });
            if (shipments.length > 0) {
                const shipmentIds = shipments.map(s => s.id);
                const movements = await manager.find(stock_movement_entity_1.StockMovement, {
                    where: { referenceType: 'shipment', referenceId: (0, typeorm_2.In)(shipmentIds), type: 'out' },
                    relations: ['stock']
                });
                for (const mov of movements) {
                    if (mov.stock) {
                        await this.stocksService.increaseStock(mov.stock.itemId, mov.stock.departmentId, mov.quantity, mov.unitCost || 0, manager, {
                            type: 'revert',
                            id: sale.id,
                            description: `Satıştan iade. (Pasife Alındı)`
                        }, userId);
                    }
                }
                const satisDept = await manager.query("SELECT id FROM departments WHERE name = 'satisdepo' LIMIT 1");
                const satisDeptId = (satisDept && satisDept.length > 0) ? String(satisDept[0].id) : null;
                if (satisDeptId) {
                    for (const mov of movements) {
                        if (mov.stock) {
                            await this.stocksService.decreaseStock(mov.stock.itemId, satisDeptId, mov.quantity, manager, {
                                type: 'revert',
                                id: sale.id,
                                description: `Satıştan İptal/İade Düşümü (Pasife Alındı)`
                            }, userId);
                        }
                    }
                }
            }
            const reservationMovements = await manager.find(stock_movement_entity_1.StockMovement, {
                where: {
                    referenceType: 'sale',
                    referenceId: sale.id,
                    description: (0, typeorm_2.Like)('%Sipariş Rezervasyonu%'),
                },
                relations: ['stock'],
            });
            if (reservationMovements && reservationMovements.length > 0) {
                const deptReleaseMap = new Map();
                for (const mov of reservationMovements) {
                    if (mov.stock && mov.stock.departmentId && mov.stock.itemId) {
                        const deptId = String(mov.stock.departmentId);
                        const list = deptReleaseMap.get(deptId) || [];
                        list.push({
                            itemId: String(mov.stock.itemId),
                            quantity: new decimal_js_1.Decimal(mov.quantity || 0).toNumber(),
                        });
                        deptReleaseMap.set(deptId, list);
                    }
                }
                for (const [deptId, items] of deptReleaseMap.entries()) {
                    await this.stocksService.releaseStockBulk(items, deptId, manager, {
                        type: 'revert',
                        id: sale.id,
                        description: `Sipariş İptali Rezervasyon İadesi: ${sale.code}`,
                    }, userId);
                }
            }
            else if (sale.items && sale.items.length > 0 && sale.departmentId) {
                const itemsToRelease = sale.items.map(item => ({
                    itemId: String(item.itemId),
                    quantity: new decimal_js_1.Decimal(item.quantity).toNumber()
                }));
                await this.stocksService.releaseStockBulk(itemsToRelease, sale.departmentId, manager, {
                    type: 'revert',
                    id: sale.id,
                    description: `Sipariş İptali Rezervasyon İadesi: ${sale.code}`
                }, userId);
            }
        }
        else if (previousStatus === 'draft') {
            const party = await manager.findOne(party_entity_1.Party, {
                where: { id: sale.partyId },
                lock: { mode: 'pessimistic_write' }
            });
            if (party) {
                await this.revertSaleDepositIfExists(manager, sale, party, userId);
                await manager.save(party_entity_1.Party, party);
            }
            await this.revertSanalDepoStock(manager, sale, userId);
        }
        await manager.update(sale_entity_1.Sale, sale.id, {
            status: 'cancelled',
            paidAmount: 0,
            updatedBy: userId,
            cancelledById: userId,
            cancelledAt: new Date(),
            cancelReason: reason
        });
        await manager.update(shipment_entity_1.Shipment, { saleId: sale.id }, { status: 'cancelled' });
        this.logsService.logActivity({
            userId,
            module: 'sales',
            action: 'CANCEL_SALE',
            tag: 'SUCCESS',
            details: `Satış iptal edildi: ${sale.code}, Sebeb: ${reason}`
        });
        return this.reportsService.findOne(saleId, manager);
    }
    async revertToDraft(saleId, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, {
            where: { id: saleId },
            relations: ['items', 'items.item']
        });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        if (sale.status !== 'approved') {
            throw new common_1.BadRequestException('Sadece onaylanmış siparişler taslağa geri döndürülebilir.');
        }
        const tlGrandTotal = finance_helper_1.FinanceHelper.mul(sale.grandTotal, sale.exchangeRate);
        const party = await manager.findOne(party_entity_1.Party, {
            where: { id: sale.partyId },
            lock: { mode: 'pessimistic_write' }
        });
        if (party) {
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                debit: new decimal_js_1.Decimal(0),
                credit: tlGrandTotal,
                transactionId: sale.id,
                source: 'REVERT_TO_DRAFT',
                description: `${sale.code} Satış Onay İptali (Taslağa Geri Dönüş) - Borç Revert`
            }));
            party.balance = finance_helper_1.FinanceHelper.sub(party.balance, tlGrandTotal);
            party.updatedBy = userId || null;
            await manager.save(party_entity_1.Party, party);
        }
        if (sale.items && sale.items.length > 0 && sale.departmentId) {
            const itemsToRelease = sale.items.map(item => ({
                itemId: String(item.itemId),
                quantity: new decimal_js_1.Decimal(item.quantity).toNumber()
            }));
            await this.stocksService.releaseStockBulk(itemsToRelease, sale.departmentId, manager, {
                type: 'revert',
                id: sale.id,
                description: `${sale.code} Satış Onay İptali Rezervasyon İadesi`
            }, userId);
        }
        const shipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { saleId: sale.id }
        });
        if (shipment) {
            if (shipment.status !== 'pending') {
                throw new common_1.BadRequestException('Sevkiyatı başlanmış veya tamamlanmış siparişler taslağa döndürülemez.');
            }
            await manager.remove(shipment_entity_1.Shipment, shipment);
        }
        sale.status = 'draft';
        sale.updatedBy = userId;
        await manager.save(sale_entity_1.Sale, sale);
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
                sale: plainSale,
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
    async shipSale(saleId, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        const party = await manager.findOne(party_entity_1.Party, {
            where: { id: sale.partyId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!party)
            throw new common_1.NotFoundException('Cari hesap bulunamadı');
        if (dto.payments && dto.payments.length > 0) {
            const currency = sale.currencyId ? await manager.findOne(currency_entity_1.Currency, { where: { id: String(sale.currencyId) } }) : null;
            const exchangeRate = currency ? new decimal_js_1.Decimal(currency.exchangeRate) : new decimal_js_1.Decimal(1);
            for (const p of dto.payments) {
                const paymentAmount = new decimal_js_1.Decimal(p.amount);
                if (paymentAmount.lte(0))
                    continue;
                const tlAmount = finance_helper_1.FinanceHelper.mul(paymentAmount, exchangeRate);
                const code = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');
                const tx = manager.create(transaction_entity_1.Transaction, {
                    code,
                    partyId: party.id,
                    commercialAccountId: String(p.commercialAccountId),
                    amount: paymentAmount,
                    currencyId: sale.currencyId || undefined,
                    exchangeRate,
                    type: 'in',
                    referenceType: 'sale',
                    referenceId: sale.id,
                    date: date_utils_1.DateUtils.getToday(),
                    description: `Sipariş Sevk Tahsilatı (Kalan Tutar) - Sipariş No: ${sale.code}`,
                    status: 'completed',
                    createdBy: userId,
                });
                const savedTx = await manager.save(tx);
                const entryDebit = new decimal_js_1.Decimal(0);
                const entryCredit = tlAmount;
                await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                    date: date_utils_1.DateUtils.getToday(),
                    partyId: party.id,
                    accountId: String(p.commercialAccountId),
                    debit: entryDebit,
                    credit: entryCredit,
                    transactionId: savedTx.id,
                    source: 'PAYMENT_IN',
                    description: `Kasa Fişi: ${code}`
                }));
                party.balance = finance_helper_1.FinanceHelper.sub(new decimal_js_1.Decimal(party.balance), tlAmount);
                sale.paidAmount = finance_helper_1.FinanceHelper.add(new decimal_js_1.Decimal(sale.paidAmount || 0), paymentAmount);
            }
            await manager.save(party_entity_1.Party, party);
            await manager.save(sale_entity_1.Sale, sale);
        }
        if (sale.paymentType !== 'VADELİ') {
            const paidAmount = new decimal_js_1.Decimal(sale.paidAmount || 0);
            const grandTotal = new decimal_js_1.Decimal(sale.grandTotal || 0);
            if (grandTotal.minus(paidAmount).abs().gt(0.01)) {
                throw new common_1.BadRequestException(`Bu siparişin ödemesi tam olarak kapatılmamıştır! ` +
                    `Toplam Ödenen: ${paidAmount.toFixed(2)} ${sale.currency?.symbol || ''}, Toplam Tutar: ${grandTotal.toFixed(2)} ${sale.currency?.symbol || ''}. ` +
                    `Siparişi sevk edebilmek için toplam ödemenin net satış tutarını karşılaması gerekmektedir.`);
            }
        }
        if (!sale.departmentId)
            throw new common_1.BadRequestException('Rezervasyon deposu bulunamadı.');
        const selectedDept = await manager.query("SELECT name FROM departments WHERE id = ? LIMIT 1", [sale.departmentId]);
        if (selectedDept && selectedDept.length > 0) {
            const deptName = selectedDept[0].name.toLowerCase();
            if (deptName === 'sanaldepo' || deptName === 'satisdepo') {
                throw new common_1.BadRequestException("Rezervasyon deposu 'sanaldepo' veya 'satisdepo' olamaz. Lütfen geçerli bir fiziksel depo seçiniz.");
            }
        }
        const shipItems = dto.items || sale.items.map(i => ({ itemId: String(i.itemId), quantity: new decimal_js_1.Decimal(i.quantity).toNumber() }));
        for (const reqItem of shipItems) {
            const lineItem = sale.items.find(si => String(si.itemId) === String(reqItem.itemId));
            if (!lineItem)
                throw new common_1.BadRequestException(`Ürün ID ${reqItem.itemId} bu siparişte yok.`);
            const orderQty = new decimal_js_1.Decimal(lineItem.quantity);
            const alreadyShipped = new decimal_js_1.Decimal(lineItem.shippedQuantity || 0);
            const remainingQty = orderQty.minus(alreadyShipped);
            const requestedQty = new decimal_js_1.Decimal(reqItem.quantity);
            if (requestedQty.gt(remainingQty)) {
                throw new common_1.BadRequestException(`Ürün ID ${reqItem.itemId}: Maksimum sevk edilebilir miktar ${remainingQty}.`);
            }
        }
        const shipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { saleId: sale.id },
            relations: ['vehicles', 'assignedStaff']
        });
        if (!shipment)
            throw new common_1.NotFoundException('Sevkiyat kaydı bulunamadı.');
        if (dto.vehicleIds && dto.vehicleIds.length > 0) {
            shipment.vehicles = await manager.find(vehicle_entity_1.Vehicle, {
                where: { id: (0, typeorm_2.In)(dto.vehicleIds) }
            });
        }
        else {
            shipment.vehicles = [];
        }
        if (dto.assignedStaffIds && dto.assignedStaffIds.length > 0) {
            shipment.assignedStaff = await manager.find(staff_entity_1.Staff, {
                where: { id: (0, typeorm_2.In)(dto.assignedStaffIds) }
            });
        }
        else {
            shipment.assignedStaff = [];
        }
        shipment.status = 'shipped';
        shipment.approvedAt = new Date();
        await manager.save(shipment_entity_1.Shipment, shipment);
        sale.status = 'shipped';
        sale.updatedBy = userId || null;
        await manager.save(sale_entity_1.Sale, sale);
        this.logsService.logActivity({
            userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
            details: `Sevkiyat yapıldı: ${sale.code}`
        });
        return this.reportsService.findOne(sale.id, manager);
    }
    async processSaleDeposit(manager, sale, party, depositAmount, commAccountId, userId) {
        await this.revertSaleDepositIfExists(manager, sale, party, userId);
        if (depositAmount.gt(0) && commAccountId) {
            const tlDeposit = finance_helper_1.FinanceHelper.mul(depositAmount, sale.exchangeRate);
            const txCode = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');
            const tx = manager.create(transaction_entity_1.Transaction, {
                code: txCode,
                partyId: party.id,
                commercialAccountId: String(commAccountId),
                amount: depositAmount,
                currencyId: sale.currencyId,
                exchangeRate: sale.exchangeRate,
                type: 'in',
                referenceType: 'sale_deposit',
                referenceId: sale.id,
                date: date_utils_1.DateUtils.getToday(),
                description: `${sale.code} Nolu Satış Kaporası / Ön Ödemesi`,
                status: 'completed',
                createdBy: userId,
            });
            const savedTx = await manager.save(tx);
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                accountId: String(commAccountId),
                debit: new decimal_js_1.Decimal(0),
                credit: tlDeposit,
                transactionId: savedTx.id,
                source: 'DEPOSIT',
                description: `${sale.code} Satış Kaporası`
            }));
            party.balance = finance_helper_1.FinanceHelper.sub(party.balance, tlDeposit);
            sale.paidAmount = depositAmount;
        }
        else {
            sale.paidAmount = new decimal_js_1.Decimal(0);
        }
    }
    async revertSaleDepositIfExists(manager, sale, party, userId) {
        const depositTx = await manager.findOne(transaction_entity_1.Transaction, {
            where: { referenceId: sale.id, referenceType: 'sale_deposit', status: 'completed' }
        });
        if (depositTx) {
            const tlDepositActual = finance_helper_1.FinanceHelper.mul(depositTx.amount, depositTx.exchangeRate);
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                accountId: depositTx.commercialAccountId,
                debit: tlDepositActual,
                credit: new decimal_js_1.Decimal(0),
                transactionId: sale.id,
                source: 'CANCEL_DEPOSIT',
                description: `${sale.code} Tahsilat İptali - Alacak Revert`
            }));
            depositTx.status = 'cancelled';
            depositTx.updatedBy = userId;
            await manager.save(transaction_entity_1.Transaction, depositTx);
            party.balance = finance_helper_1.FinanceHelper.add(party.balance, tlDepositActual);
        }
    }
    async softDelete(id, userId, user) {
        const manager = this.transactionContext.manager;
        const sale = await this.reportsService.findOne(id, manager);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak siparişler kalıcı silinebilir.');
        }
        if (user && !user.isSystemAdmin && !user.permissions?.includes('SALES_DELETE_ALL')) {
            if (sale.createdBy !== String(user.sub)) {
                throw new common_1.ForbiddenException('Sadece kendi oluşturduğunuz satış siparişlerini silebilirsiniz.');
            }
        }
        const party = await manager.findOne(party_entity_1.Party, { where: { id: sale.partyId }, lock: { mode: 'pessimistic_write' } });
        if (party) {
            await this.revertSaleDepositIfExists(manager, sale, party, userId);
            await manager.save(party_entity_1.Party, party);
        }
        await this.revertSanalDepoStock(manager, sale, userId);
        await manager.softDelete(sale_entity_1.Sale, id);
    }
    async revertSanalDepoStock(manager, sale, userId) {
        const sanalDept = await manager.query("SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1");
        const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';
        if (sale.items && sale.items.length > 0) {
            for (const item of sale.items) {
                await this.stocksService.increaseStock(String(item.itemId), sanalDeptId, item.quantity, item.costPrice || 0, manager, {
                    type: 'revert',
                    id: sale.id,
                    description: `Taslak İptal/Silme Sanal Stok İadesi: ${sale.code}`
                }, userId);
            }
        }
    }
};
exports.SalesTransactionsService = SalesTransactionsService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.CreateSaleDto, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "create", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.UpdateSaleDto, String, Object]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "update", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ApproveSaleDto, String, Object]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "approveSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "cancelSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "revertToDraft", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ShipSaleDto, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "shipSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "softDelete", null);
exports.SalesTransactionsService = SalesTransactionsService = SalesTransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_item_entity_1.SaleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(sale_type_entity_1.SaleType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sequence_generator_service_1.SequenceGeneratorService,
        stocks_service_1.StocksService,
        logs_service_1.LogsService,
        transaction_context_service_1.TransactionContextService,
        outbox_service_1.OutboxService,
        sales_reports_service_1.SalesReportsService])
], SalesTransactionsService);
//# sourceMappingURL=sales-transactions.service.js.map