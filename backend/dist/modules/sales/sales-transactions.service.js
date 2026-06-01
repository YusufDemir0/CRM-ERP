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
const commercial_account_entity_1 = require("../finance/accounts/entities/commercial-account.entity");
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
        const party = await manager.findOne(party_entity_1.Party, { where: { id: dto.partyId } });
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
        const calcResult = sale_calculator_1.SaleCalculator.calculate(dto.items, itemDataMap, dto.discountAmount, dto.discountPercent, isRetail);
        const sale = manager.create(sale_entity_1.Sale, {
            ...dto,
            code,
            exchangeRate: currentExchangeRate,
            status: 'draft',
            deposit: new decimal_js_1.Decimal(dto.deposit || 0),
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
        return this.reportsService.findOne(savedSale.id, manager);
    }
    async update(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await this.reportsService.findOne(id, manager);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
        }
        const updatableFields = [
            'notes', 'deliveryDate', 'staffId', 'phone', 'address', 'taxNumber',
            'email', 'source', 'city', 'district', 'commercialAccountId',
            'maturityDays', 'paymentType', 'installments'
        ];
        updatableFields.forEach(field => {
            if (dto[field] !== undefined)
                sale[field] = dto[field];
        });
        sale.updatedBy = userId || null;
        if (dto.items && dto.items.length > 0) {
            const isRetail = sale.saleType?.abbreviation === 'PRK' || sale.saleTypeId === '2';
            const itemDataMap = await this.reportsService.fetchItemData(manager, dto.items.map(i => i.itemId));
            const calcResult = sale_calculator_1.SaleCalculator.calculate(dto.items, itemDataMap, dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount, dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent, isRetail);
            sale.totalAmount = calcResult.totalAmount;
            sale.discountAmount = calcResult.discountAmount;
            sale.discountPercent = calcResult.discountPercent;
            sale.kdv = calcResult.kdv;
            sale.grandTotal = calcResult.grandTotal;
            sale.totalCost = calcResult.totalCost;
            sale.profit = calcResult.profit;
            if (dto.deposit !== undefined)
                sale.deposit = new decimal_js_1.Decimal(dto.deposit);
            await manager.delete(sale_item_entity_1.SaleItem, { saleId: sale.id });
            const saleItemEntities = calcResult.lines.map(line => manager.create(sale_item_entity_1.SaleItem, {
                ...line,
                saleId: sale.id,
                costPrice: line.costPrice,
                updatedBy: userId
            }));
            await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
        }
        else if (dto.deposit !== undefined) {
            sale.deposit = new decimal_js_1.Decimal(dto.deposit);
        }
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
    async approveSale(saleId, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        if (sale.status !== 'draft')
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler onaylanabilir.');
        const party = await manager.findOne(party_entity_1.Party, {
            where: { id: sale.partyId },
            lock: { mode: 'pessimistic_write' }
        });
        if (!party)
            throw new common_1.NotFoundException('Cari hesap bulunamadı');
        const tlGrandTotal = finance_helper_1.FinanceHelper.mul(sale.grandTotal, sale.exchangeRate);
        const depositToTL = finance_helper_1.FinanceHelper.mul(sale.deposit, sale.exchangeRate);
        sale.status = 'approved';
        sale.departmentId = dto.departmentId;
        if (dto.commercialAccountId) {
            sale.commercialAccountId = dto.commercialAccountId;
        }
        sale.updatedBy = userId || null;
        await manager.save(sale_entity_1.Sale, sale);
        const existingShipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { saleId: sale.id }
        });
        if (!existingShipment) {
            const shipment = manager.create(shipment_entity_1.Shipment, {
                saleId: sale.id,
                outgoingDepartmentId: dto.departmentId || sale.departmentId,
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
    async cancelSale(saleId, userId) {
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
            const plainSale = {
                id: sale.id,
                code: sale.code,
                partyId: sale.partyId,
                paymentType: sale.paymentType,
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
                topic: 'sale.cancelled',
                payload: {
                    sale: plainSale,
                    tlGrandTotal: tlGrandTotal.toString(),
                    tlDeposit: tlDeposit.toString(),
                    userId,
                },
                manager,
            });
            await manager.update(transaction_entity_1.Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
        }
        await manager.update(sale_entity_1.Sale, sale.id, { status: 'cancelled', paidAmount: 0, updatedBy: userId });
        return this.reportsService.findOne(saleId, manager);
    }
    async shipSale(saleId, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        if (sale.status !== 'approved' && sale.status !== 'shipped') {
            throw new common_1.BadRequestException('Sadece onaylanmış veya kısmi sevk edilmiş siparişler sevk edilebilir.');
        }
        if (!sale.departmentId)
            throw new common_1.BadRequestException('Rezervasyon deposu bulunamadı.');
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
        const reserveMovements = await manager.find(stock_movement_entity_1.StockMovement, {
            where: { referenceType: 'sale', referenceId: sale.id },
            relations: ['stock']
        });
        const deptShipments = new Map();
        for (const reqItem of shipItems) {
            const itemMovements = reserveMovements.filter(m => m.stock?.itemId === String(reqItem.itemId));
            let remainingQtyToShip = new decimal_js_1.Decimal(reqItem.quantity);
            for (const mov of itemMovements) {
                if (remainingQtyToShip.lte(0))
                    break;
                const stock = mov.stock;
                if (!stock)
                    continue;
                const shippedResult = await manager.createQueryBuilder(stock_movement_entity_1.StockMovement, 'm')
                    .where('m.stockId = :stockId', { stockId: stock.id })
                    .andWhere('m.referenceType = "sale"')
                    .andWhere('m.referenceId = :saleId', { saleId: sale.id })
                    .andWhere('m.id != :movId', { movId: mov.id })
                    .select('SUM(m.quantity)', 'total')
                    .getRawOne();
                const alreadyShippedFromStock = new decimal_js_1.Decimal(shippedResult?.total || 0);
                const maxShippableFromDept = new decimal_js_1.Decimal(mov.quantity).sub(alreadyShippedFromStock);
                if (maxShippableFromDept.gt(0)) {
                    const qtyToShipFromDept = decimal_js_1.Decimal.min(remainingQtyToShip, maxShippableFromDept);
                    const deptId = stock.departmentId;
                    const list = deptShipments.get(deptId) || [];
                    list.push({ itemId: reqItem.itemId, quantity: qtyToShipFromDept.toNumber() });
                    deptShipments.set(deptId, list);
                    remainingQtyToShip = remainingQtyToShip.sub(qtyToShipFromDept);
                }
            }
            if (remainingQtyToShip.gt(0)) {
                const deptId = sale.departmentId || '1';
                const list = deptShipments.get(deptId) || [];
                list.push({ itemId: reqItem.itemId, quantity: remainingQtyToShip.toNumber() });
                deptShipments.set(deptId, list);
            }
        }
        for (const [deptId, items] of deptShipments.entries()) {
            if (items.length > 0) {
                await this.stocksService.finalizeShipmentBulk(items, deptId, manager, { type: 'sale', id: sale.id, description: `Sevkiyat Çıkışı: ${sale.code}` }, userId);
            }
        }
        const saleItemsToUpdate = [];
        for (const item of shipItems) {
            const saleItem = sale.items.find(si => String(si.itemId) === String(item.itemId));
            if (saleItem) {
                saleItem.shippedQuantity = new decimal_js_1.Decimal(saleItem.shippedQuantity || 0).add(item.quantity);
                saleItemsToUpdate.push(saleItem);
            }
        }
        if (saleItemsToUpdate.length > 0) {
            await manager.save(sale_item_entity_1.SaleItem, saleItemsToUpdate);
        }
        sale.status = 'shipped';
        sale.updatedBy = userId || null;
        await manager.save(sale_entity_1.Sale, sale);
        this.logsService.logActivity({
            userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
            details: `Sevkiyat yapıldı: ${sale.code}`
        });
        return this.reportsService.findOne(sale.id, manager);
    }
    async softDelete(id) {
        const sale = await this.reportsService.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak siparişler kalıcı silinebilir.');
        }
        await this.saleRepo.softDelete(id);
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
    __metadata("design:paramtypes", [String, sale_dto_1.UpdateSaleDto, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "update", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ApproveSaleDto, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "approveSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "cancelSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sale_dto_1.ShipSaleDto, String]),
    __metadata("design:returntype", Promise)
], SalesTransactionsService.prototype, "shipSale", null);
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