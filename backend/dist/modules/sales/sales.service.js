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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_type_entity_1 = require("./entities/sale-type.entity");
const stock_entity_1 = require("../inventory/stocks/entities/stock.entity");
const stock_movement_entity_1 = require("../inventory/stocks/entities/stock-movement.entity");
const party_entity_1 = require("../parties/entities/party.entity");
const currency_entity_1 = require("../finance/currencies/entities/currency.entity");
const transaction_entity_1 = require("../finance/transactions/entities/transaction.entity");
const sequence_generator_service_1 = require("../../common/services/sequence-generator.service");
let SalesService = SalesService_1 = class SalesService {
    constructor(saleRepo, saleItemRepo, saleTypeRepo, dataSource, sequenceGenerator) {
        this.saleRepo = saleRepo;
        this.saleItemRepo = saleItemRepo;
        this.saleTypeRepo = saleTypeRepo;
        this.dataSource = dataSource;
        this.sequenceGenerator = sequenceGenerator;
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
            .leftJoinAndSelect('sale.currency', 'currency')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('items.item', 'item');
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
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const party = await queryRunner.manager.findOne(party_entity_1.Party, { where: { id: dto.partyId } });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı.');
            if (party.type === 'provider')
                throw new common_1.BadRequestException('Sadece Tedarikçi tipindeki bir cariye satış yapılamaz.');
            const currency = await queryRunner.manager.findOne(currency_entity_1.Currency, { where: { id: dto.currencyId } });
            const currentExchangeRate = currency ? Number(currency.exchangeRate) : 1;
            const code = await this.sequenceGenerator.generateSaleCode(queryRunner, dto.saleTypeId);
            let rawTotalAmount = 0;
            const saleItems = [];
            for (const itemDto of dto.items) {
                const discountAmount = itemDto.discountAmount || 0;
                const discountPercent = itemDto.discountPercent || 0;
                let netPrice = itemDto.price;
                if (discountAmount > 0)
                    netPrice = itemDto.price - discountAmount;
                else if (discountPercent > 0)
                    netPrice = itemDto.price * (1 - discountPercent / 100);
                const subtotal = itemDto.quantity * netPrice;
                rawTotalAmount += subtotal;
                saleItems.push({
                    itemId: itemDto.itemId,
                    quantity: itemDto.quantity,
                    price: itemDto.price,
                    discountAmount,
                    discountPercent,
                    netPrice,
                    kdvRate: itemDto.kdvRate ?? 20,
                    description: itemDto.description,
                    createdBy: userId,
                });
            }
            const headerDiscountAmount = dto.discountAmount || 0;
            const headerDiscountPercent = dto.discountPercent || 0;
            let discountToSubtract = headerDiscountAmount;
            if (headerDiscountPercent > 0) {
                discountToSubtract = rawTotalAmount * (headerDiscountPercent / 100);
            }
            const discountedMatrah = rawTotalAmount - discountToSubtract;
            let totalKdv = 0;
            saleItems.forEach(item => {
                const lineRatio = rawTotalAmount > 0 ? (item.quantity * item.netPrice) / rawTotalAmount : 0;
                const lineMatrah = discountedMatrah * lineRatio;
                const lineKdv = lineMatrah * (item.kdvRate / 100);
                item.kdvAmount = lineKdv;
                item.lineTotal = lineMatrah + lineKdv;
                totalKdv += lineKdv;
            });
            const grandTotal = discountedMatrah + totalKdv;
            const sale = queryRunner.manager.create(sale_entity_1.Sale, {
                code,
                partyId: dto.partyId,
                saleTypeId: dto.saleTypeId,
                currencyId: dto.currencyId,
                exchangeRate: currentExchangeRate,
                deliveryDate: dto.deliveryDate,
                status: 'draft',
                deposit: dto.deposit || 0,
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
                await queryRunner.manager.save(queryRunner.manager.create(sale_item_entity_1.SaleItem, { ...si, saleId: savedSale.id }));
            }
            await queryRunner.commitTransaction();
            return this.findOne(savedSale.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async update(id, dto, userId) {
        const sale = await this.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir. İptal / İade süreçlerini kullanın.');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (dto.notes !== undefined)
                sale.notes = dto.notes;
            if (dto.deliveryDate !== undefined)
                sale.deliveryDate = dto.deliveryDate;
            sale.updatedBy = userId || null;
            if (dto.items && dto.items.length > 0) {
                let rawTotalAmount = 0;
                const saleItems = [];
                for (const itemDto of dto.items) {
                    const discountAmount = itemDto.discountAmount || 0;
                    const discountPercent = itemDto.discountPercent || 0;
                    let netPrice = itemDto.price;
                    if (discountAmount > 0)
                        netPrice = itemDto.price - discountAmount;
                    else if (discountPercent > 0)
                        netPrice = itemDto.price * (1 - discountPercent / 100);
                    rawTotalAmount += itemDto.quantity * netPrice;
                    saleItems.push({
                        itemId: itemDto.itemId, quantity: itemDto.quantity, price: itemDto.price,
                        discountAmount, discountPercent, netPrice, kdvRate: itemDto.kdvRate ?? 20,
                        description: itemDto.description, createdBy: userId,
                    });
                }
                const headerDiscountAmount = dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount;
                const headerDiscountPercent = dto.discountPercent !== undefined ? dto.discountPercent : sale.discountPercent;
                let discountToSubtract = headerDiscountAmount;
                if (headerDiscountPercent > 0)
                    discountToSubtract = rawTotalAmount * (headerDiscountPercent / 100);
                const discountedMatrah = rawTotalAmount - discountToSubtract;
                let totalKdv = 0;
                saleItems.forEach(item => {
                    const lineRatio = rawTotalAmount > 0 ? (item.quantity * item.netPrice) / rawTotalAmount : 0;
                    const lineMatrah = discountedMatrah * lineRatio;
                    const lineKdv = lineMatrah * (item.kdvRate / 100);
                    item.kdvAmount = lineKdv;
                    item.lineTotal = lineMatrah + lineKdv;
                    totalKdv += lineKdv;
                });
                sale.totalAmount = rawTotalAmount;
                sale.discountAmount = headerDiscountAmount;
                sale.discountPercent = headerDiscountPercent;
                sale.kdv = totalKdv;
                sale.grandTotal = discountedMatrah + totalKdv;
                sale.deposit = dto.deposit !== undefined ? dto.deposit : sale.deposit;
                await queryRunner.manager.delete(sale_item_entity_1.SaleItem, { saleId: sale.id });
                for (const si of saleItems) {
                    await queryRunner.manager.save(queryRunner.manager.create(sale_item_entity_1.SaleItem, { ...si, saleId: sale.id }));
                }
            }
            else {
                if (dto.deposit !== undefined)
                    sale.deposit = dto.deposit;
            }
            await queryRunner.manager.save(sale);
            await queryRunner.commitTransaction();
            return this.findOne(id);
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
    }
    async approveSale(saleId, dto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sale = await queryRunner.manager.findOne(sale_entity_1.Sale, { where: { id: saleId }, relations: ['items'] });
            if (!sale)
                throw new common_1.NotFoundException('Satış bulunamadı');
            if (sale.status !== 'draft')
                throw new common_1.BadRequestException('Sadece taslak (draft) durumundaki siparişler onaylanabilir.');
            const party = await queryRunner.manager.findOne(party_entity_1.Party, { where: { id: sale.partyId } });
            if (!party)
                throw new common_1.NotFoundException('Cari hesap bulunamadı');
            const tlGrandTotal = Number(sale.grandTotal) * Number(sale.exchangeRate);
            const currentPartyBalance = Number(party.balance);
            if (Number(party.creditLimitPlus) > 0 && (currentPartyBalance + tlGrandTotal) > Number(party.creditLimitPlus)) {
                throw new common_1.BadRequestException(`Cari limit aşıldı! Firmanın Kredi Limiti: ${party.creditLimitPlus}. Sipariş sonrası bakiye: ${currentPartyBalance + tlGrandTotal} olmaktadır. İşlem gerçekleştirilemez.`);
            }
            for (const saleItem of sale.items) {
                let stock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                    where: { itemId: saleItem.itemId, departmentId: dto.departmentId },
                });
                if (!stock || Number(stock.quantity) < Number(saleItem.quantity)) {
                    throw new common_1.BadRequestException(`Yetersiz stok durumu. (Ürün ID: ${saleItem.itemId}, Depo ID: ${dto.departmentId}) Üretim emri açmanız veya mal alımı yapmanız gerekebilir.`);
                }
                const quantityBefore = Number(stock.quantity);
                const quantityAfter = quantityBefore - Number(saleItem.quantity);
                await queryRunner.manager.update(stock_entity_1.Stock, stock.id, { quantity: quantityAfter, updatedBy: userId });
                await queryRunner.manager.save(queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                    stockId: stock.id, quantity: saleItem.quantity, quantityBefore, quantityAfter,
                    type: 'out', referenceType: 'sale', referenceId: sale.id, description: `Satış Onayı: ${sale.code}`, createdBy: userId,
                }));
            }
            await queryRunner.manager.update(party_entity_1.Party, party.id, { balance: currentPartyBalance + tlGrandTotal, updatedBy: userId });
            let finalDepositSaved = 0;
            if (Number(sale.deposit) > 0) {
                if (!dto.commercialAccountId) {
                    throw new common_1.BadRequestException('Siparişte kapora alınmış. Bu paranın gireceği Finans (Kasa/Banka) hesabını seçmelisiniz.');
                }
                const txCode = await this.sequenceGenerator.generateTransactionCode(queryRunner, 'MKB');
                const tlDeposit = Number(sale.deposit) * Number(sale.exchangeRate);
                await queryRunner.manager.save(queryRunner.manager.create(transaction_entity_1.Transaction, {
                    code: txCode, partyId: party.id, commercialAccountId: dto.commercialAccountId,
                    amount: Number(sale.deposit), currencyId: sale.currencyId, exchangeRate: sale.exchangeRate,
                    type: 'in', referenceType: 'sale', referenceId: sale.id, date: new Date().toISOString().split('T')[0],
                    description: `${sale.code} Nolu Sipariş Peşinat / Kaporası`, status: 'completed', createdBy: userId
                }));
                await queryRunner.manager.update(party_entity_1.Party, party.id, { balance: (currentPartyBalance + tlGrandTotal) - tlDeposit, updatedBy: userId });
                finalDepositSaved = tlDeposit;
            }
            await queryRunner.manager.update(sale_entity_1.Sale, sale.id, { status: 'approved', updatedBy: userId });
            await queryRunner.commitTransaction();
            this.logger.log(`✅ Sipariş Onaylandı: ${sale.code}, Satış Tutarı: ${tlGrandTotal}, Kapora Düşüşü: ${finalDepositSaved}`);
            return this.findOne(saleId);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`❌ Sipariş Onay Hata: ${error.message}`);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async cancelSale(saleId, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sale = await queryRunner.manager.findOne(sale_entity_1.Sale, { where: { id: saleId } });
            if (!sale)
                throw new common_1.NotFoundException('Satış bulunamadı');
            if (sale.status === 'cancelled')
                throw new common_1.BadRequestException('Sipariş zaten iptal edilmiş.');
            if (sale.status === 'approved' || sale.status === 'shipped') {
                const party = await queryRunner.manager.findOne(party_entity_1.Party, { where: { id: sale.partyId } });
                if (!party)
                    throw new common_1.NotFoundException('Cari hesap bulunamadı');
                const outMovements = await queryRunner.manager.find(stock_movement_entity_1.StockMovement, { where: { referenceType: 'sale', referenceId: sale.id, type: 'out' }, relations: ['stock'] });
                for (const mov of outMovements) {
                    const stock = await queryRunner.manager.findOne(stock_entity_1.Stock, { where: { id: mov.stockId } });
                    if (stock) {
                        const newQty = Number(stock.quantity) + Number(mov.quantity);
                        await queryRunner.manager.update(stock_entity_1.Stock, stock.id, { quantity: newQty });
                        await queryRunner.manager.save(queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
                            stockId: stock.id, quantity: mov.quantity, quantityBefore: stock.quantity, quantityAfter: newQty,
                            type: 'in', referenceType: 'return', referenceId: sale.id, description: `${sale.code} Sipariş İptaliyle Stoka İade`, createdBy: userId
                        }));
                    }
                }
                const tlGrandTotal = Number(sale.grandTotal) * Number(sale.exchangeRate);
                const tlDeposit = Number(sale.deposit) * Number(sale.exchangeRate);
                const targetBalance = Number(party.balance) - tlGrandTotal + tlDeposit;
                await queryRunner.manager.update(party_entity_1.Party, party.id, { balance: targetBalance, updatedBy: userId });
                await queryRunner.manager.update(transaction_entity_1.Transaction, { referenceType: 'sale', referenceId: sale.id }, { status: 'cancelled', updatedBy: userId });
            }
            await queryRunner.manager.update(sale_entity_1.Sale, sale.id, { status: 'cancelled', updatedBy: userId });
            await queryRunner.commitTransaction();
            return this.findOne(saleId);
        }
        catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        }
        finally {
            await queryRunner.release();
        }
    }
    async softDelete(id) {
        const sale = await this.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak siparişler kalıcı silinebilir. Onaylanmış faturalar için "İptal Et / Revert" işlemi yapınız.');
        }
        await this.saleRepo.softDelete(id);
    }
    async getStatus() {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        const [stats, pending] = await Promise.all([
            this.saleRepo.createQueryBuilder('sale')
                .select("SUM(sale.grandTotal * sale.exchangeRate)", "revenue")
                .addSelect("COUNT(*)", "total")
                .where("sale.createdAt >= :date", { date: firstDayOfMonth.toISOString() })
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
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_item_entity_1.SaleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(sale_type_entity_1.SaleType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        sequence_generator_service_1.SequenceGeneratorService])
], SalesService);
//# sourceMappingURL=sales.service.js.map