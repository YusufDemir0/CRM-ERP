"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipment_entity_1 = require("./entities/shipment.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const shipment_dto_1 = require("./dto/shipment.dto");
const stocks_transactions_service_1 = require("./stocks-transactions.service");
const sale_entity_1 = require("../../sales/entities/sale.entity");
const sale_item_entity_1 = require("../../sales/entities/sale-item.entity");
const transaction_context_service_1 = require("../../../common/services/transaction-context.service");
const logs_service_1 = require("../../logs/logs.service");
const transactional_1 = require("@nestjs-cls/transactional");
const ExcelJS = __importStar(require("exceljs"));
const decimal_js_1 = require("decimal.js");
const sql_helper_1 = require("../../../common/utils/sql.helper");
const sales_transactions_service_1 = require("../../sales/sales-transactions.service");
let ShipmentsService = class ShipmentsService {
    constructor(shipmentRepo, stocksTransactionsService, transactionContext, logsService, salesTransactionsService) {
        this.shipmentRepo = shipmentRepo;
        this.stocksTransactionsService = stocksTransactionsService;
        this.transactionContext = transactionContext;
        this.logsService = logsService;
        this.salesTransactionsService = salesTransactionsService;
    }
    async findAll(query) {
        const qb = this.shipmentRepo.createQueryBuilder('shipment')
            .leftJoinAndSelect('shipment.sale', 'sale')
            .leftJoinAndSelect('sale.party', 'party')
            .leftJoinAndSelect('shipment.outgoingDepartment', 'outgoingDepartment')
            .leftJoinAndSelect('shipment.vehicles', 'vehicle')
            .leftJoinAndSelect('shipment.assignedStaff', 'staff')
            .select([
            'shipment.id', 'shipment.saleId', 'shipment.outgoingDepartmentId',
            'shipment.deliveryCity', 'shipment.deliveryDistrict', 'shipment.deliveryAddress',
            'shipment.carrierNameOrPlate', 'shipment.status', 'shipment.approvedAt',
            'shipment.deadline', 'shipment.createdAt', 'shipment.updatedAt',
            'sale.id', 'sale.code', 'sale.grandTotal', 'sale.status',
            'party.id', 'party.name',
            'outgoingDepartment.id', 'outgoingDepartment.name',
            'vehicle.id', 'vehicle.name', 'vehicle.plate',
            'staff.id', 'staff.firstName', 'staff.lastName'
        ]);
        if (query.status && query.status !== 'all') {
            qb.andWhere('shipment.status = :status', { status: query.status });
        }
        if (query.city) {
            qb.andWhere('shipment.deliveryCity = :city', { city: query.city });
        }
        if (query.district) {
            qb.andWhere('shipment.deliveryDistrict = :district', { district: query.district });
        }
        if (String(query.today) === 'true') {
            const todayStr = new Date().toISOString().split('T')[0];
            qb.andWhere('shipment.deadline = :todayStr', { todayStr });
        }
        if (query.search) {
            const s = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            if (s) {
                qb.andWhere('(shipment.deliveryCity LIKE :s OR shipment.deliveryDistrict LIKE :s OR shipment.deliveryAddress LIKE :s OR shipment.carrierNameOrPlate LIKE :s OR sale.code LIKE :s OR party.name LIKE :s)', { s });
            }
        }
        const sortCol = 'shipment.createdAt';
        qb.orderBy(sortCol, 'DESC');
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20))
            }
        };
    }
    async findOne(id) {
        const shipment = await this.shipmentRepo.findOne({
            where: { id: String(id) },
            relations: ['sale', 'sale.items', 'sale.party', 'outgoingDepartment', 'vehicles', 'assignedStaff']
        });
        if (!shipment) {
            throw new common_1.NotFoundException('Sevkiyat kaydı bulunamadı');
        }
        return shipment;
    }
    async create(dto, userId) {
        const manager = this.transactionContext.manager;
        const shipment = manager.create(shipment_entity_1.Shipment, {
            saleId: dto.saleId,
            outgoingDepartmentId: dto.outgoingDepartmentId,
            deliveryCity: dto.deliveryCity,
            deliveryDistrict: dto.deliveryDistrict,
            deliveryAddress: dto.deliveryAddress,
            deadline: dto.deadline,
            status: 'pending',
        });
        return manager.save(shipment_entity_1.Shipment, shipment);
    }
    async dispatch(id, dto, userId) {
        const manager = this.transactionContext.manager;
        const shipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { id: String(id) },
            relations: ['sale', 'sale.items']
        });
        if (!shipment)
            throw new common_1.NotFoundException('Sevkiyat kaydı bulunamadı');
        if (shipment.status !== 'pending') {
            throw new common_1.BadRequestException('Sadece bekleyen sevkiyatlar yola çıkarılabilir');
        }
        if (shipment.sale && shipment.sale.paymentType !== 'VADELİ') {
            const paidAmount = new decimal_js_1.Decimal(shipment.sale.paidAmount || 0);
            const grandTotal = new decimal_js_1.Decimal(shipment.sale.grandTotal || 0);
            if (grandTotal.minus(paidAmount).abs().gt(0.01)) {
                throw new common_1.BadRequestException(`Bu siparişin ödemesi tam olarak kapatılmamıştır! ` +
                    `Toplam Ödenen: ${paidAmount.toFixed(2)}, Toplam Tutar: ${grandTotal.toFixed(2)}. ` +
                    `Siparişi sevk edebilmek için toplam ödemenin net satış tutarını karşılaması gerekmektedir.`);
            }
        }
        const outgoingDeptId = shipment.outgoingDepartmentId;
        if (outgoingDeptId) {
            const selectedDept = await manager.query("SELECT name FROM departments WHERE id = ? LIMIT 1", [outgoingDeptId]);
            if (selectedDept && selectedDept.length > 0) {
                const deptName = selectedDept[0].name.toLowerCase();
                if (deptName === 'sanaldepo' || deptName === 'satisdepo') {
                    throw new common_1.BadRequestException("Sevkiyat çıkış deposu 'sanaldepo' veya 'satisdepo' olamaz. Lütfen geçerli bir fiziksel depo seçiniz.");
                }
            }
        }
        shipment.status = 'shipped';
        shipment.carrierNameOrPlate = dto.carrierNameOrPlate || null;
        shipment.approvedAt = new Date();
        const saved = await manager.save(shipment_entity_1.Shipment, shipment);
        if (shipment.sale) {
            shipment.sale.status = 'shipped';
            await manager.save(sale_entity_1.Sale, shipment.sale);
        }
        this.logsService.logActivity({
            userId,
            module: 'inventory',
            action: 'SHIPMENT_DISPATCH',
            tag: 'DISPATCH',
            details: `Sevkiyat yola çıktı. ID: ${shipment.id}, Taşıyıcı: ${dto.carrierNameOrPlate || 'Belirtilmedi'}`,
        });
        return saved;
    }
    async complete(id, userId) {
        const manager = this.transactionContext.manager;
        const shipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { id: String(id) },
            relations: ['sale', 'sale.items']
        });
        if (!shipment)
            throw new common_1.NotFoundException('Sevkiyat kaydı bulunamadı');
        if (shipment.status !== 'shipped' && shipment.status !== 'pending') {
            throw new common_1.BadRequestException('Sadece bekleyen veya yola çıkmış sevkiyatlar tamamlanabilir');
        }
        shipment.status = 'completed';
        const saved = await manager.save(shipment_entity_1.Shipment, shipment);
        if (shipment.sale && shipment.sale.items && shipment.sale.items.length > 0) {
            const itemsToDeduct = shipment.sale.items.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity
            }));
            const sanalDept = await manager.query("SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1");
            const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';
            const reserveMovements = await manager.find(stock_movement_entity_1.StockMovement, {
                where: { referenceType: 'sale', referenceId: shipment.sale.id },
                relations: ['stock']
            });
            const physicalReserveMovements = reserveMovements.filter(m => m.stock && String(m.stock.departmentId) !== String(sanalDeptId));
            const deptShipments = new Map();
            for (const reqItem of itemsToDeduct) {
                const itemMovements = physicalReserveMovements.filter(m => m.stock?.itemId === String(reqItem.itemId));
                let remainingQtyToShip = new decimal_js_1.Decimal(reqItem.quantity);
                for (const mov of itemMovements) {
                    if (remainingQtyToShip.lte(0))
                        break;
                    const stock = mov.stock;
                    if (!stock)
                        continue;
                    const shippedResult = await manager.createQueryBuilder(stock_movement_entity_1.StockMovement, 'm')
                        .where('m.stockId = :stockId', { stockId: stock.id })
                        .andWhere('m.referenceType IN (:...refTypes)', { refTypes: ['sale', 'shipment'] })
                        .andWhere('m.referenceId = :saleId', { saleId: shipment.sale.id })
                        .andWhere('m.id != :movId', { movId: mov.id })
                        .select('SUM(m.quantity)', 'total')
                        .getRawOne();
                    const alreadyShippedFromStock = new decimal_js_1.Decimal(shippedResult?.total || 0);
                    const maxShippableFromDept = new decimal_js_1.Decimal(mov.quantity).sub(alreadyShippedFromStock);
                    if (maxShippableFromDept.gt(0)) {
                        const qtyToShipFromDept = decimal_js_1.Decimal.min(remainingQtyToShip, maxShippableFromDept);
                        const deptId = stock.departmentId;
                        const list = deptShipments.get(deptId) || [];
                        list.push({ itemId: String(reqItem.itemId), quantity: qtyToShipFromDept.toNumber() });
                        deptShipments.set(deptId, list);
                        remainingQtyToShip = remainingQtyToShip.sub(qtyToShipFromDept);
                    }
                }
                if (remainingQtyToShip.gt(0)) {
                    const deptId = shipment.outgoingDepartmentId || '1';
                    const list = deptShipments.get(deptId) || [];
                    list.push({ itemId: String(reqItem.itemId), quantity: remainingQtyToShip.toNumber() });
                    deptShipments.set(deptId, list);
                }
            }
            for (const [deptId, items] of deptShipments.entries()) {
                if (items.length > 0) {
                    await this.stocksTransactionsService.finalizeShipmentBulk(items, deptId, manager, {
                        type: 'shipment',
                        id: shipment.id,
                        description: 'Stok Düştü'
                    }, userId);
                }
            }
            for (const item of shipment.sale.items) {
                await this.stocksTransactionsService.increaseStock(String(item.itemId), sanalDeptId, item.quantity, item.costPrice || 0, manager, {
                    type: 'shipment',
                    id: shipment.id,
                    description: `Sanal Stok Sevk Girişi: ${shipment.sale.code}`
                }, userId);
            }
            const saleItemsToUpdate = [];
            for (const item of shipment.sale.items) {
                item.shippedQuantity = new decimal_js_1.Decimal(item.shippedQuantity || 0).add(item.quantity);
                saleItemsToUpdate.push(item);
            }
            await manager.save(sale_item_entity_1.SaleItem, saleItemsToUpdate);
            shipment.sale.status = 'invoiced';
            await manager.save(sale_entity_1.Sale, shipment.sale);
        }
        this.logsService.logActivity({
            userId,
            module: 'inventory',
            action: 'SHIPMENT_COMPLETE',
            tag: 'COMPLETE',
            details: `Sevkiyat tamamlandı ve stoklar düşüldü. ID: ${shipment.id}, Satış Kodu: ${shipment.sale?.code}`,
        });
        return saved;
    }
    async cancel(id, userId) {
        const manager = this.transactionContext.manager;
        const shipment = await manager.findOne(shipment_entity_1.Shipment, {
            where: { id: String(id) },
            relations: ['sale']
        });
        if (!shipment)
            throw new common_1.NotFoundException('Sevkiyat kaydı bulunamadı');
        if (shipment.status === 'completed' || shipment.status === 'cancelled') {
            throw new common_1.BadRequestException('Tamamlanmış veya zaten iptal edilmiş sevkiyatlar iptal edilemez');
        }
        if (shipment.sale) {
            await this.salesTransactionsService.cancelSale(shipment.sale.id, 'Sevkiyat İptal Edildi', userId);
        }
        else {
            shipment.status = 'cancelled';
            await manager.save(shipment_entity_1.Shipment, shipment);
        }
        this.logsService.logActivity({
            userId,
            module: 'inventory',
            action: 'SHIPMENT_CANCEL',
            tag: 'CANCEL',
            details: `Sevkiyat iptal edildi. ID: ${shipment.id}`,
        });
        const refreshed = await manager.findOne(shipment_entity_1.Shipment, { where: { id: String(id) } });
        if (!refreshed)
            throw new common_1.NotFoundException('Sevkiyat kaydı bulunamadı');
        return refreshed;
    }
    async getMetrics() {
        const [pending, shipped, completed, cancelled] = await Promise.all([
            this.shipmentRepo.count({ where: { status: 'pending' } }),
            this.shipmentRepo.count({ where: { status: 'shipped' } }),
            this.shipmentRepo.count({ where: { status: 'completed' } }),
            this.shipmentRepo.count({ where: { status: 'cancelled' } }),
        ]);
        const routePooling = await this.shipmentRepo.createQueryBuilder('shipment')
            .where('shipment.status IN (:...statuses)', { statuses: ['pending', 'shipped'] })
            .select('shipment.deliveryCity', 'deliveryCity')
            .addSelect('shipment.deliveryDistrict', 'deliveryDistrict')
            .addSelect('COUNT(shipment.id)', 'count')
            .groupBy('shipment.deliveryCity')
            .addGroupBy('shipment.deliveryDistrict')
            .getRawMany();
        const mappedRoutePooling = routePooling.map(r => ({
            deliveryCity: r.deliveryCity || 'Belirtilmemiş',
            deliveryDistrict: r.deliveryDistrict || 'Belirtilmemiş',
            count: Number(r.count || 0)
        }));
        return {
            statusCounts: { pending, shipped, completed, cancelled },
            routePooling: mappedRoutePooling
        };
    }
    async exportToExcel(query) {
        query.limit = 10000;
        const { data: shipments } = await this.findAll(query);
        const groups = {};
        for (const sh of shipments) {
            const city = sh.deliveryCity || 'Belirtilmemiş';
            const district = sh.deliveryDistrict || 'Belirtilmemiş';
            if (!groups[city])
                groups[city] = {};
            if (!groups[city][district])
                groups[city][district] = [];
            groups[city][district].push(sh);
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sevkiyat Havuzu (Route Pooling)');
        worksheet.columns = [
            { header: 'SEVKİYAT ID', key: 'id', width: 15 },
            { header: 'SATIŞ KODU', key: 'saleCode', width: 20 },
            { header: 'MÜŞTERİ / CARİ', key: 'partyName', width: 35 },
            { header: 'ADRES', key: 'address', width: 50 },
            { header: 'TAŞIYICI / PLAKA', key: 'carrier', width: 20 },
            { header: 'TERMİN TARİHİ', key: 'deadline', width: 15 },
            { header: 'DURUM', key: 'status', width: 15 }
        ];
        worksheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        const statusMap = {
            'pending': 'Bekliyor',
            'shipped': 'Yolda',
            'completed': 'Teslim Edildi',
            'cancelled': 'İptal Edildi'
        };
        for (const city of Object.keys(groups).sort()) {
            for (const district of Object.keys(groups[city]).sort()) {
                const list = groups[city][district];
                const groupRow = worksheet.addRow({
                    id: `📍 ${city.toUpperCase()} - ${district.toUpperCase()} (${list.length} Sevkiyat)`
                });
                worksheet.mergeCells(groupRow.number, 1, groupRow.number, 7);
                groupRow.font = { bold: true, color: { argb: 'FF0F172A' } };
                groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                for (const sh of list) {
                    worksheet.addRow({
                        id: String(sh.id),
                        saleCode: sh.sale?.code || '',
                        partyName: sh.sale?.party?.name || '',
                        address: sh.deliveryAddress || '',
                        carrier: sh.carrierNameOrPlate || '-',
                        deadline: sh.deadline || '',
                        status: statusMap[sh.status] || sh.status
                    });
                }
                worksheet.addRow({});
            }
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return new common_1.StreamableFile(Buffer.from(buffer));
    }
};
exports.ShipmentsService = ShipmentsService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipment_dto_1.CreateShipmentDto, String]),
    __metadata("design:returntype", Promise)
], ShipmentsService.prototype, "create", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shipment_dto_1.DispatchShipmentDto, String]),
    __metadata("design:returntype", Promise)
], ShipmentsService.prototype, "dispatch", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ShipmentsService.prototype, "complete", null);
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ShipmentsService.prototype, "cancel", null);
exports.ShipmentsService = ShipmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => sales_transactions_service_1.SalesTransactionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        stocks_transactions_service_1.StocksTransactionsService,
        transaction_context_service_1.TransactionContextService,
        logs_service_1.LogsService,
        sales_transactions_service_1.SalesTransactionsService])
], ShipmentsService);
//# sourceMappingURL=shipments.service.js.map