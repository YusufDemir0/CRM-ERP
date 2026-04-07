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
            const code = await this.sequenceGenerator.generateSaleCode(queryRunner, dto.saleTypeId);
            let totalAmount = 0;
            let totalKdv = 0;
            const saleItems = [];
            for (const itemDto of dto.items) {
                const kdvRate = itemDto.kdvRate ?? 20;
                const discountAmount = itemDto.discountAmount || 0;
                const discountPercent = itemDto.discountPercent || 0;
                let netPrice = itemDto.price;
                if (discountAmount > 0) {
                    netPrice = itemDto.price - discountAmount;
                }
                else if (discountPercent > 0) {
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
            const headerDiscountAmount = dto.discountAmount || 0;
            const headerDiscountPercent = dto.discountPercent || 0;
            let grandTotal = totalAmount;
            if (headerDiscountAmount > 0) {
                grandTotal -= headerDiscountAmount;
            }
            else if (headerDiscountPercent > 0) {
                grandTotal -= grandTotal * (headerDiscountPercent / 100);
            }
            grandTotal += totalKdv;
            const sale = queryRunner.manager.create(sale_entity_1.Sale, {
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
            for (const si of saleItems) {
                const saleItem = queryRunner.manager.create(sale_item_entity_1.SaleItem, {
                    ...si,
                    saleId: savedSale.id,
                });
                await queryRunner.manager.save(saleItem);
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
            throw new common_1.BadRequestException('Sadece taslak durumundaki siparişler düzenlenebilir');
        }
        Object.assign(sale, dto);
        sale.updatedBy = userId || null;
        return this.saleRepo.save(sale);
    }
    async approveSale(saleId, dto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sale = await queryRunner.manager.findOne(sale_entity_1.Sale, {
                where: { id: saleId },
                relations: ['items'],
            });
            if (!sale) {
                throw new common_1.NotFoundException('Satış bulunamadı');
            }
            if (sale.status !== 'draft') {
                throw new common_1.BadRequestException(`Sadece taslak durumundaki siparişler onaylanabilir. Mevcut durum: ${sale.status}`);
            }
            if (!sale.items || sale.items.length === 0) {
                throw new common_1.BadRequestException('Satışta hiç kalem bulunmuyor');
            }
            this.logger.log(`🔄 Sale approval başlatıldı: ${sale.code} (${sale.items.length} kalem)`);
            for (const saleItem of sale.items) {
                let stock = await queryRunner.manager.findOne(stock_entity_1.Stock, {
                    where: { itemId: saleItem.itemId, departmentId: dto.departmentId },
                });
                if (!stock) {
                    throw new common_1.BadRequestException(`Stok kaydı bulunamadı. Item ID: ${saleItem.itemId}, Departman ID: ${dto.departmentId}`);
                }
                const quantityBefore = Number(stock.quantity);
                const requiredQty = Number(saleItem.quantity);
                if (quantityBefore < requiredQty) {
                    throw new common_1.BadRequestException(`Yetersiz stok! Item ID: ${saleItem.itemId}, ` +
                        `Mevcut: ${quantityBefore}, İstenen: ${requiredQty}`);
                }
                const quantityAfter = quantityBefore - requiredQty;
                await queryRunner.manager.update(stock_entity_1.Stock, stock.id, {
                    quantity: quantityAfter,
                    updatedBy: userId,
                });
                const movement = queryRunner.manager.create(stock_movement_entity_1.StockMovement, {
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
                this.logger.debug(`  📦 Stok düşüldü: Item ${saleItem.itemId}, ${quantityBefore} → ${quantityAfter}`);
            }
            const party = await queryRunner.manager.findOne(party_entity_1.Party, {
                where: { id: sale.partyId },
            });
            if (!party) {
                throw new common_1.NotFoundException('Cari hesap bulunamadı');
            }
            const currentBalance = Number(party.balance);
            const grandTotal = Number(sale.grandTotal);
            const newBalance = currentBalance + grandTotal;
            await queryRunner.manager.update(party_entity_1.Party, party.id, {
                balance: newBalance,
                updatedBy: userId,
            });
            this.logger.debug(`  💰 Cari bakiye güncellendi: ${party.name}, ${currentBalance} → ${newBalance} (+${grandTotal})`);
            await queryRunner.manager.update(sale_entity_1.Sale, sale.id, {
                status: 'approved',
                updatedBy: userId,
            });
            await queryRunner.commitTransaction();
            this.logger.log(`✅ Sale onaylandı: ${sale.code}, Grand Total: ${grandTotal}, Party: ${party.name}`);
            return this.findOne(saleId);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`❌ Sale approval ROLLBACK: ${error.message}`);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async cancelSale(saleId, userId) {
        const sale = await this.findOne(saleId);
        if (sale.status === 'cancelled') {
            throw new common_1.BadRequestException('Bu satış zaten iptal edilmiş');
        }
        if (sale.status === 'approved' || sale.status === 'shipped' || sale.status === 'invoiced') {
            throw new common_1.BadRequestException('Onaylanmış siparişlerin iptali için ayrı bir süreç gereklidir (iade/iptal faturası)');
        }
        sale.status = 'cancelled';
        sale.updatedBy = userId || null;
        return this.saleRepo.save(sale);
    }
    async softDelete(id) {
        const sale = await this.findOne(id);
        if (sale.status !== 'draft') {
            throw new common_1.BadRequestException('Sadece taslak siparişler silinebilir');
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