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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const stocks_service_1 = require("../inventory/stocks/stocks.service");
const logs_service_1 = require("../logs/logs.service");
const item_entity_1 = require("../inventory/items/entities/item.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_type_entity_1 = require("./entities/sale-type.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const currency_entity_1 = require("../finance/currencies/entities/currency.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
const decimal_js_1 = require("decimal.js");
const sale_dto_1 = require("./dto/sale.dto");
const finance_helper_1 = require("../../common/utils/finance.helper");
const ledger_entity_1 = require("../parties/entities/ledger.entity");
const date_utils_1 = require("../../common/utils/date.utils");
const transactional_decorator_1 = require("../../common/decorators/transactional.decorator");
const transaction_context_service_1 = require("../../common/services/transaction-context.service");
const dayjs_1 = __importDefault(require("dayjs"));
let SalesService = SalesService_1 = class SalesService {
    constructor(saleRepo, saleItemRepo, saleTypeRepo, dataSource, sequenceGenerator, stocksService, logsService, transactionContext) {
        this.saleRepo = saleRepo;
        this.saleItemRepo = saleItemRepo;
        this.saleTypeRepo = saleTypeRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.stocksService = stocksService;
        this.logsService = logsService;
        this.transactionContext = transactionContext;
        this.logger = new common_1.Logger(SalesService_1.name);
    }
    async findAllSaleTypes() {
        return this.saleTypeRepo.find();
    }
    async createSaleType(dto, userId) {
        const type = new sale_type_entity_1.SaleType();
        type.name = dto.name;
        type.abbreviation = dto.abbreviation;
        type.createdBy = userId ?? null;
        return this.saleTypeRepo.save(type);
    }
    async findAll(query) {
        const qb = this.saleRepo.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.party', 'party')
            .leftJoinAndSelect('sale.saleType', 'saleType')
            .leftJoinAndSelect('sale.currency', 'currency');
        if (query.search) {
            qb.where('(sale.code LIKE :s OR party.name LIKE :s)', { s: `%${query.search}%` });
        }
        if (query.status)
            qb.andWhere('sale.status = :status', { status: query.status });
        if (query.partyId)
            qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });
        qb.orderBy(`sale.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const sale = await this.saleRepo.findOne({
            where: { id },
            relations: ['party', 'saleType', 'currency', 'items', 'items.item'],
        });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        return sale;
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        const party = await manager.findOne(party_entity_1.Party, { where: { id: dto.partyId } });
        if (!party)
            throw new common_1.NotFoundException('Cari hesap bulunamadı.');
        if (party.type === 'provider')
            throw new common_1.BadRequestException('Sadece Tedarikçi tipindeki bir cariye satış yapılamaz.');
        const currency = await manager.findOne(currency_entity_1.Currency, { where: { id: dto.currencyId } });
        const currentExchangeRate = currency ? currency.exchangeRate : new decimal_js_1.Decimal(1);
        const code = await this.sequenceGenerator.generateSaleCode(manager, dto.saleTypeId);
        let rawTotalAmount = new decimal_js_1.Decimal(0);
        const saleItems = [];
        for (const itemDto of dto.items) {
            const dbItem = await manager.findOne(item_entity_1.Item, {
                where: { id: itemDto.itemId, state: 1 },
            });
            if (!dbItem) {
                throw new common_1.NotFoundException(`Ürün bulunamadı veya pasif durumda: ID ${itemDto.itemId}`);
            }
            const unitPrice = new decimal_js_1.Decimal(dbItem.salePrice || 0);
            const discountAmount = new decimal_js_1.Decimal(itemDto.discountAmount || 0);
            const discountPercent = new decimal_js_1.Decimal(itemDto.discountPercent || 0);
            const maxAllowedDiscount = unitPrice.mul(0.5);
            if (discountAmount.gt(maxAllowedDiscount)) {
                throw new common_1.BadRequestException(`Ürün ID ${itemDto.itemId} için maksimum iskonto sınırı (${maxAllowedDiscount}) aşıldı.`);
            }
            let netPrice = unitPrice;
            if (discountAmount.gt(0)) {
                netPrice = finance_helper_1.FinanceHelper.sub(netPrice, discountAmount);
            }
            else if (discountPercent.gt(0)) {
                const discount = finance_helper_1.FinanceHelper.mul(netPrice, discountPercent.div(100));
                netPrice = finance_helper_1.FinanceHelper.sub(netPrice, discount);
            }
            const subtotal = finance_helper_1.FinanceHelper.mul(itemDto.quantity, netPrice);
            rawTotalAmount = finance_helper_1.FinanceHelper.add(rawTotalAmount, subtotal);
            saleItems.push({
                itemId: itemDto.itemId,
                quantity: new decimal_js_1.Decimal(itemDto.quantity),
                price: unitPrice,
                discountAmount,
                discountPercent,
                netPrice,
                kdvRate: new decimal_js_1.Decimal(itemDto.kdvRate ?? 20),
                description: itemDto.description,
                createdBy: userId,
            });
        }
        const headerDiscountAmount = new decimal_js_1.Decimal(dto.discountAmount || 0);
        const headerDiscountPercent = new decimal_js_1.Decimal(dto.discountPercent || 0);
        let discountToSubtract = headerDiscountAmount;
        if (headerDiscountPercent.gt(0)) {
            discountToSubtract = finance_helper_1.FinanceHelper.mul(rawTotalAmount, headerDiscountPercent.div(100));
        }
        const discountedMatrah = finance_helper_1.FinanceHelper.sub(rawTotalAmount, discountToSubtract);
        let totalKdv = new decimal_js_1.Decimal(0);
        saleItems.forEach(item => {
            const lineRatio = rawTotalAmount.gt(0) ? finance_helper_1.FinanceHelper.div(finance_helper_1.FinanceHelper.mul(item.quantity, item.netPrice), rawTotalAmount, 6) : new decimal_js_1.Decimal(0);
            const lineMatrah = finance_helper_1.FinanceHelper.mul(discountedMatrah, lineRatio);
            const lineKdv = finance_helper_1.FinanceHelper.calculateKdv(lineMatrah, Number(item.kdvRate));
            item.kdvAmount = lineKdv;
            item.lineTotal = finance_helper_1.FinanceHelper.add(lineMatrah, lineKdv);
            totalKdv = finance_helper_1.FinanceHelper.add(totalKdv, lineKdv);
        });
        const grandTotal = finance_helper_1.FinanceHelper.add(discountedMatrah, totalKdv);
        const sale = manager.create(sale_entity_1.Sale, {
            code,
            partyId: dto.partyId,
            saleTypeId: dto.saleTypeId,
            currencyId: dto.currencyId,
            exchangeRate: currentExchangeRate,
            deliveryDate: dto.deliveryDate,
            status: 'draft',
            deposit: new decimal_js_1.Decimal(dto.deposit || 0),
            totalAmount: rawTotalAmount,
            discountAmount: headerDiscountAmount,
            discountPercent: headerDiscountPercent,
            kdv: totalKdv,
            grandTotal,
            notes: dto.notes,
            createdBy: userId,
        });
        const savedSale = await manager.save(sale);
        const saleItemEntities = saleItems.map(si => manager.create(sale_item_entity_1.SaleItem, { ...si, saleId: savedSale.id }));
        await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
        return this.findOne(savedSale.id);
    }
    async update(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await this.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
        }
        if (dto.notes !== undefined)
            sale.notes = dto.notes;
        if (dto.deliveryDate !== undefined)
            sale.deliveryDate = dto.deliveryDate;
        sale.updatedBy = userId || null;
        if (dto.items && dto.items.length > 0) {
            let rawTotalAmount = new decimal_js_1.Decimal(0);
            const saleItems = [];
            for (const itemDto of dto.items) {
                const dbItem = await manager.findOne(item_entity_1.Item, {
                    where: { id: itemDto.itemId, state: 1 },
                });
                if (!dbItem) {
                    throw new common_1.NotFoundException(`Ürün bulunamadı veya pasif durumda: ID ${itemDto.itemId}`);
                }
                const unitPrice = new decimal_js_1.Decimal(dbItem.salePrice || 0);
                const discountAmount = new decimal_js_1.Decimal(itemDto.discountAmount || 0);
                const discountPercent = new decimal_js_1.Decimal(itemDto.discountPercent || 0);
                const maxAllowedDiscount = unitPrice.mul(0.5);
                if (discountAmount.gt(maxAllowedDiscount)) {
                    throw new common_1.BadRequestException(`Ürün ID ${itemDto.itemId} için maksimum iskonto sınırı (${maxAllowedDiscount}) aşıldı.`);
                }
                let netPrice = unitPrice;
                if (discountAmount.gt(0)) {
                    netPrice = finance_helper_1.FinanceHelper.sub(netPrice, discountAmount);
                }
                else if (discountPercent.gt(0)) {
                    const discount = finance_helper_1.FinanceHelper.mul(netPrice, discountPercent.div(100));
                    netPrice = finance_helper_1.FinanceHelper.sub(netPrice, discount);
                }
                rawTotalAmount = finance_helper_1.FinanceHelper.add(rawTotalAmount, finance_helper_1.FinanceHelper.mul(itemDto.quantity, netPrice));
                saleItems.push({
                    itemId: itemDto.itemId,
                    quantity: new decimal_js_1.Decimal(itemDto.quantity),
                    price: unitPrice,
                    discountAmount,
                    discountPercent,
                    netPrice,
                    kdvRate: new decimal_js_1.Decimal(itemDto.kdvRate ?? 20),
                    description: itemDto.description,
                    createdBy: userId,
                });
            }
            const headerDiscountAmount = new decimal_js_1.Decimal(dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount);
            const headerDiscountPercent = new decimal_js_1.Decimal(dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent);
            let discountToSubtract = headerDiscountAmount;
            if (headerDiscountPercent.gt(0)) {
                discountToSubtract = finance_helper_1.FinanceHelper.mul(rawTotalAmount, headerDiscountPercent.div(100));
            }
            const discountedMatrah = finance_helper_1.FinanceHelper.sub(rawTotalAmount, discountToSubtract);
            let totalKdv = new decimal_js_1.Decimal(0);
            saleItems.forEach(item => {
                const lineRatio = rawTotalAmount.gt(0)
                    ? finance_helper_1.FinanceHelper.div(finance_helper_1.FinanceHelper.mul(item.quantity, item.netPrice), rawTotalAmount, 6)
                    : new decimal_js_1.Decimal(0);
                const lineMatrah = finance_helper_1.FinanceHelper.mul(discountedMatrah, lineRatio);
                const lineKdv = finance_helper_1.FinanceHelper.calculateKdv(lineMatrah, Number(item.kdvRate));
                item.kdvAmount = lineKdv;
                item.lineTotal = finance_helper_1.FinanceHelper.add(lineMatrah, lineKdv);
                totalKdv = finance_helper_1.FinanceHelper.add(totalKdv, lineKdv);
            });
            sale.totalAmount = rawTotalAmount;
            sale.discountAmount = headerDiscountAmount;
            sale.discountPercent = headerDiscountPercent;
            sale.kdv = totalKdv;
            sale.grandTotal = finance_helper_1.FinanceHelper.add(discountedMatrah, totalKdv);
            sale.deposit = new decimal_js_1.Decimal(dto.deposit !== undefined ? dto.deposit : sale.deposit);
            await manager.delete(sale_item_entity_1.SaleItem, { saleId: sale.id });
            const saleItemEntities = saleItems.map(si => manager.create(sale_item_entity_1.SaleItem, { ...si, saleId: sale.id }));
            await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
        }
        else {
            if (dto.deposit !== undefined)
                sale.deposit = new decimal_js_1.Decimal(dto.deposit);
        }
        await manager.save(sale);
        return this.findOne(id);
    }
    async approveSale(saleId, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'] });
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
        if (party.creditLimit.gt(0) && (finance_helper_1.FinanceHelper.add(party.balance, tlGrandTotal)).gt(party.creditLimit)) {
            throw new common_1.BadRequestException(`Cari limit aşıldı! Sipariş sonrası bakiye: ${finance_helper_1.FinanceHelper.add(party.balance, tlGrandTotal)} olmaktadır.`);
        }
        sale.status = 'approved';
        sale.departmentId = dto.departmentId;
        sale.updatedBy = userId || null;
        await manager.save(sale_entity_1.Sale, sale);
        await this.stocksService.reserveStockBulk(sale.items.map(i => ({ itemId: i.itemId, quantity: i.quantity })), dto.departmentId, manager, userId);
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
        const depositToTL = finance_helper_1.FinanceHelper.mul(sale.deposit, sale.exchangeRate);
        if (depositToTL.gt(0) && dto.commercialAccountId) {
            const txCode = await this.sequenceGenerator.generateTransactionCode(manager, 'MKB');
            await manager.save(manager.create(transaction_entity_1.Transaction, {
                code: txCode,
                partyId: party.id,
                commercialAccountId: dto.commercialAccountId,
                amount: sale.deposit,
                currencyId: sale.currencyId,
                exchangeRate: sale.exchangeRate,
                type: 'in',
                referenceType: 'sale',
                referenceId: sale.id,
                date: date_utils_1.DateUtils.getToday(),
                description: `${sale.code} Nolu Sipariş Peşinat / Kaporası`,
                status: 'completed',
                createdBy: userId
            }));
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                accountId: dto.commercialAccountId,
                debit: new decimal_js_1.Decimal(0),
                credit: depositToTL,
                transactionId: sale.id,
                source: 'DEPOSIT',
                description: `${sale.code} Sipariş Peşinat Tahsilatı`
            }));
            party.balance = finance_helper_1.FinanceHelper.sub(party.balance, depositToTL);
        }
        party.updatedBy = userId || null;
        await manager.save(party_entity_1.Party, party);
        this.logsService.logActivity({
            userId,
            module: 'sales',
            action: 'APPROVE_SALE',
            tag: 'SUCCESS',
            details: `Satış onaylandı: ${sale.code}, Toplam: ${sale.totalAmount}`,
        });
        return this.findOne(sale.id);
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
        if (sale.status === 'approved' || sale.status === 'shipped') {
            const party = await manager.findOne(party_entity_1.Party, {
                where: { id: sale.partyId },
                lock: { mode: 'pessimistic_write' }
            });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı');
            await this.stocksService.revertStockMovementsByReference('sale', sale.id, manager, userId);
            const itemsToUnreserve = sale.items.map(si => ({
                itemId: si.itemId,
                quantity: new decimal_js_1.Decimal(si.quantity).sub(si.shippedQuantity || 0)
            })).filter(i => i.quantity.gt(0));
            if (itemsToUnreserve.length > 0) {
                await this.stocksService.unreserveStockBulk(itemsToUnreserve, sale.departmentId || 1, manager, userId);
            }
            const tlGrandTotal = finance_helper_1.FinanceHelper.mul(sale.grandTotal, sale.exchangeRate);
            const tlDeposit = finance_helper_1.FinanceHelper.mul(sale.deposit, sale.exchangeRate);
            const targetBalance = finance_helper_1.FinanceHelper.add(finance_helper_1.FinanceHelper.sub(party.balance, tlGrandTotal), tlDeposit);
            await manager.update(party_entity_1.Party, party.id, { balance: targetBalance, updatedBy: userId });
            await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                date: date_utils_1.DateUtils.getToday(),
                partyId: party.id,
                debit: new decimal_js_1.Decimal(0),
                credit: tlGrandTotal,
                transactionId: sale.id,
                source: 'CANCEL_SALE',
                description: `${sale.code} Satış İptali - Borç Revert`
            }));
            if (tlDeposit.gt(0)) {
                const depositTx = await manager.findOne(transaction_entity_1.Transaction, {
                    where: { referenceType: 'sale', referenceId: sale.id, type: 'in' }
                });
                await manager.save(manager.create(ledger_entity_1.AccountingLedger, {
                    date: date_utils_1.DateUtils.getToday(),
                    partyId: party.id,
                    accountId: depositTx?.commercialAccountId,
                    debit: tlDeposit,
                    credit: new decimal_js_1.Decimal(0),
                    transactionId: sale.id,
                    source: 'CANCEL_DEPOSIT',
                    description: `${sale.code} Kapora İptali - Alacak Revert`
                }));
            }
            await manager.update(transaction_entity_1.Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
        }
        await manager.update(sale_entity_1.Sale, sale.id, { status: 'cancelled', updatedBy: userId });
        return this.findOne(saleId);
    }
    async softDelete(id) {
        const sale = await this.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak siparişler kalıcı silinebilir.');
        }
        await this.saleRepo.softDelete(id);
    }
    async getStatus() {
        const firstDayOfMonth = (0, dayjs_1.default)().startOf('month').toDate();
        const [stats, pending] = await Promise.all([
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
                .addSelect("COUNT(*)", "total")
                .where("sale.createdAt >= :date", { date: date_utils_1.DateUtils.getStartOfDay(firstDayOfMonth) })
                .andWhere("sale.status != 'cancelled'")
                .getRawOne(),
            this.saleRepo.count({ where: { status: 'draft' } }),
        ]);
        return {
            monthlyRevenue: new decimal_js_1.Decimal(stats.revenue || 0),
            monthlyOrders: new decimal_js_1.Decimal(stats.total || 0),
            pendingOrders: new decimal_js_1.Decimal(pending || 0),
        };
    }
    async shipSale(saleId, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'] });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        if (sale.status !== 'approved' && sale.status !== 'shipped') {
            throw new common_1.BadRequestException('Sadece onaylanmış veya kısmi sevk edilmiş siparişler sevk edilebilir.');
        }
        if (!sale.departmentId)
            throw new common_1.BadRequestException('Rezervasyon deposu bulunamadı.');
        const shipItems = dto.items || sale.items.map(i => ({ itemId: Number(i.itemId), quantity: Number(i.quantity) }));
        for (const reqItem of shipItems) {
            const lineItem = sale.items.find(si => Number(si.itemId) === Number(reqItem.itemId));
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
        await this.stocksService.finalizeShipmentBulk(shipItems, sale.departmentId, manager, { type: 'sale', id: sale.id, description: `Sevkiyat Çıkışı: ${sale.code}` }, userId);
        for (const item of shipItems) {
            const saleItem = sale.items.find(si => Number(si.itemId) === Number(item.itemId));
            if (saleItem) {
                saleItem.shippedQuantity = new decimal_js_1.Decimal(saleItem.shippedQuantity || 0).add(item.quantity);
                await manager.save(sale_item_entity_1.SaleItem, saleItem);
            }
        }
        sale.status = 'shipped';
        sale.updatedBy = userId || null;
        await manager.save(sale_entity_1.Sale, sale);
        this.logsService.logActivity({
            userId, module: 'sales', action: 'SHIP_SALE', tag: 'SUCCESS',
            details: `Sevkiyat yapıldı: ${sale.code}`
        });
        return this.findOne(sale.id);
    }
};
exports.SalesService = SalesService;
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.CreateSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "create", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sale_dto_1.UpdateSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "update", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sale_dto_1.ApproveSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "approveSale", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "cancelSale", null);
__decorate([
    (0, transactional_decorator_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sale_dto_1.ShipSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "shipSale", null);
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_item_entity_1.SaleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(sale_type_entity_1.SaleType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService,
        stocks_service_1.StocksService,
        logs_service_1.LogsService,
        transaction_context_service_1.TransactionContextService])
], SalesService);
//# sourceMappingURL=sales.service.js.map