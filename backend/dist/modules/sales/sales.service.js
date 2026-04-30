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
const user_entity_1 = require("../auth/entities/user.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const currency_entity_1 = require("../finance/currencies/entities/currency.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
const decimal_js_1 = require("decimal.js");
const sale_dto_1 = require("./dto/sale.dto");
const finance_helper_1 = require("../../common/utils/finance.helper");
const ledger_entity_1 = require("../parties/entities/ledger.entity");
const date_utils_1 = require("../../common/utils/date.utils");
const transactional_1 = require("@nestjs-cls/transactional");
const transaction_context_service_1 = require("../../common/services/transaction-context.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const dayjs_1 = __importDefault(require("dayjs"));
const sql_helper_1 = require("../../common/utils/sql.helper");
const sale_calculator_1 = require("./domain/sale-calculator");
let SalesService = SalesService_1 = class SalesService {
    constructor(saleRepo, saleItemRepo, saleTypeRepo, dataSource, sequenceGenerator, stocksService, logsService, transactionContext, outboxService) {
        this.saleRepo = saleRepo;
        this.saleItemRepo = saleItemRepo;
        this.saleTypeRepo = saleTypeRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
        this.stocksService = stocksService;
        this.logsService = logsService;
        this.transactionContext = transactionContext;
        this.outboxService = outboxService;
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
            const searchPattern = query.search.replace(/[+><()~*\"@\-]/g, ' ').trim();
            const safeLikePattern = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            if (searchPattern) {
                qb.where('(MATCH(sale.code, sale.notes, sale.phone, sale.address, sale.city, sale.district, sale.taxNumber, sale.email, sale.source) AGAINST(:s IN BOOLEAN MODE) OR party.name LIKE :like)', { s: `*${searchPattern}*`, like: safeLikePattern });
            }
        }
        if (query.status)
            qb.andWhere('sale.status = :status', { status: query.status });
        if (query.partyId)
            qb.andWhere('sale.partyId = :partyId', { partyId: query.partyId });
        const allowedSortMap = {
            'code': 'sale.code',
            'createdAt': 'sale.createdAt',
            'grandTotal': 'sale.grandTotal',
            'status': 'sale.status',
            'party.name': 'party.name',
            'saleType.name': 'saleType.name'
        };
        const sortField = allowedSortMap[query.sortBy || ''] || 'sale.createdAt';
        qb.orderBy(sortField, query.sortOrderSafe);
        if (sortField !== 'sale.createdAt') {
            qb.addOrderBy('sale.createdAt', 'DESC');
        }
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page: query.page || 1, limit: query.limit || 20, totalPages: Math.ceil(total / (query.limit || 20)) },
        };
    }
    async findOne(id) {
        const sale = await this.transactionContext.manager.findOne(sale_entity_1.Sale, {
            where: { id },
            relations: ['party', 'saleType', 'currency', 'items', 'items.item'],
        });
        if (!sale)
            throw new common_1.NotFoundException('Satış bulunamadı');
        return sale;
    }
    async fetchItemData(manager, itemIds) {
        const items = await manager.find(item_entity_1.Item, {
            where: { id: (0, typeorm_2.In)(itemIds), state: 1 }
        });
        if (items.length !== itemIds.length) {
            const foundIds = items.map(i => i.id);
            const missing = itemIds.filter(id => !foundIds.includes(id));
            throw new common_1.NotFoundException(`Bazı ürünler bulunamadı veya pasif: ${missing.join(', ')}`);
        }
        const map = new Map();
        items.forEach(i => map.set(i.id, { id: i.id, salePrice: i.salePrice || 0 }));
        return map;
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        const party = await manager.findOne(party_entity_1.Party, { where: { id: dto.partyId } });
        if (!party)
            throw new common_1.NotFoundException('Cari bulunamadı.');
        if (party.state === 0)
            throw new common_1.BadRequestException('Pasif durumdaki bir cariye işlem yapılamaz.');
        if (party.type === 'supplier')
            throw new common_1.BadRequestException('Sadece Tedarikçi tipindeki bir cariye satış yapılamaz.');
        const currency = await manager.findOne(currency_entity_1.Currency, { where: { id: dto.currencyId } });
        const currentExchangeRate = currency ? currency.exchangeRate : new decimal_js_1.Decimal(1);
        const user = await manager.findOne(user_entity_1.User, { where: { id: userId } });
        const userDeptId = user?.departmentId || 1;
        const code = await this.sequenceGenerator.generateSaleCode(manager, Number(userDeptId));
        const itemDataMap = await this.fetchItemData(manager, dto.items.map(i => i.itemId));
        const calcResult = sale_calculator_1.SaleCalculator.calculate(dto.items, itemDataMap, dto.discountAmount, dto.discountPercent);
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
            createdBy: userId,
        });
        const savedSale = await manager.save(sale);
        const saleItemEntities = calcResult.lines.map(line => manager.create(sale_item_entity_1.SaleItem, {
            ...line,
            saleId: savedSale.id,
            createdBy: userId
        }));
        await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
        return this.findOne(savedSale.id);
    }
    async update(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const sale = await this.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir.');
        }
        const updatableFields = [
            'notes', 'deliveryDate', 'staffId', 'phone', 'address', 'taxNumber',
            'email', 'source', 'city', 'district', 'commercialAccountId'
        ];
        updatableFields.forEach(field => {
            if (dto[field] !== undefined)
                sale[field] = dto[field];
        });
        sale.updatedBy = userId || null;
        if (dto.items && dto.items.length > 0) {
            const itemDataMap = await this.fetchItemData(manager, dto.items.map(i => i.itemId));
            const calcResult = sale_calculator_1.SaleCalculator.calculate(dto.items, itemDataMap, dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount, dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent);
            sale.totalAmount = calcResult.totalAmount;
            sale.discountAmount = calcResult.discountAmount;
            sale.discountPercent = calcResult.discountPercent;
            sale.kdv = calcResult.kdv;
            sale.grandTotal = calcResult.grandTotal;
            if (dto.deposit !== undefined)
                sale.deposit = new decimal_js_1.Decimal(dto.deposit);
            await manager.delete(sale_item_entity_1.SaleItem, { saleId: sale.id });
            const saleItemEntities = calcResult.lines.map(line => manager.create(sale_item_entity_1.SaleItem, {
                ...line,
                saleId: sale.id,
                updatedBy: userId
            }));
            await manager.save(sale_item_entity_1.SaleItem, saleItemEntities);
        }
        else if (dto.deposit !== undefined) {
            sale.deposit = new decimal_js_1.Decimal(dto.deposit);
        }
        await manager.save(sale);
        return this.findOne(id);
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
        if (party.creditLimit.gt(0) && (finance_helper_1.FinanceHelper.add(party.balance, tlGrandTotal)).gt(party.creditLimit)) {
            throw new common_1.BadRequestException(`Cari limit aşıldı! Sipariş sonrası bakiye: ${finance_helper_1.FinanceHelper.add(party.balance, tlGrandTotal)} olmaktadır.`);
        }
        sale.status = 'approved';
        sale.departmentId = dto.departmentId;
        sale.updatedBy = userId || null;
        await manager.save(sale_entity_1.Sale, sale);
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
        const sale = await manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
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
        const saleItemsToUpdate = [];
        for (const item of shipItems) {
            const saleItem = sale.items.find(si => Number(si.itemId) === Number(item.itemId));
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
        return this.findOne(sale.id);
    }
};
exports.SalesService = SalesService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_dto_1.CreateSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "create", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sale_dto_1.UpdateSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "update", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sale_dto_1.ApproveSaleDto, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "approveSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SalesService.prototype, "cancelSale", null);
__decorate([
    (0, transactional_1.Transactional)(),
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
        transaction_context_service_1.TransactionContextService,
        outbox_service_1.OutboxService])
], SalesService);
//# sourceMappingURL=sales.service.js.map