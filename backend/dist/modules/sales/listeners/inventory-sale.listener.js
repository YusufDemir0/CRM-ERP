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
var InventorySaleListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventorySaleListener = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const stocks_service_1 = require("../../inventory/stocks/stocks.service");
const stock_movement_entity_1 = require("../../inventory/stocks/entities/stock-movement.entity");
const shipment_entity_1 = require("../../inventory/stocks/entities/shipment.entity");
const rabbitmq_service_1 = require("../../../common/services/rabbitmq.service");
const decimal_js_1 = require("decimal.js");
let InventorySaleListener = InventorySaleListener_1 = class InventorySaleListener {
    constructor(stocksService, dataSource, rabbitMQService) {
        this.stocksService = stocksService;
        this.dataSource = dataSource;
        this.rabbitMQService = rabbitMQService;
        this.logger = new common_1.Logger(InventorySaleListener_1.name);
    }
    async onModuleInit() {
        this.setupConsumer();
        this.setupCancelConsumer();
    }
    setupConsumer() {
        const trySubscribe = async () => {
            if (this.rabbitMQService.isConnected()) {
                await this.rabbitMQService.subscribe('ermay.inventory.sale_approved', 'sale.approved', async (msg) => {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        await this.handleSaleApproved(payload);
                    }
                    catch (err) {
                        this.logger.error(`Error processing inventory logic: ${err.message}`);
                        throw err;
                    }
                });
            }
            else {
                setTimeout(trySubscribe, 2000);
            }
        };
        trySubscribe();
    }
    async handleSaleApproved(payload) {
        const { sale, departmentId, userId } = payload;
        await this.dataSource.transaction(async (manager) => {
            const existingShipment = await manager.findOne(shipment_entity_1.Shipment, {
                where: { saleId: sale.id }
            });
            if (existingShipment) {
                this.logger.warn(`Idempotency: Shipment for sale.id=${sale.id} already exists. Skipping.`);
                return;
            }
            const outgoingDeptId = sale.departmentId || departmentId || '1';
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
        });
    }
    setupCancelConsumer() {
        const trySubscribe = async () => {
            if (this.rabbitMQService.isConnected()) {
                await this.rabbitMQService.subscribe('ermay.inventory.sale_cancelled', 'sale.cancelled', async (msg) => {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        await this.handleSaleCancelled(payload);
                    }
                    catch (err) {
                        this.logger.error(`Error processing inventory cancel logic: ${err.message}`);
                        throw err;
                    }
                });
            }
            else {
                setTimeout(trySubscribe, 2000);
            }
        };
        trySubscribe();
    }
    async handleSaleCancelled(payload) {
        const { sale, userId } = payload;
        await this.dataSource.transaction(async (manager) => {
            const sanalDept = await manager.query("SELECT id FROM departments WHERE name = 'sanaldepo' LIMIT 1");
            const sanalDeptId = (sanalDept && sanalDept.length > 0) ? String(sanalDept[0].id) : '1';
            const reserveMovements = await manager.find(stock_movement_entity_1.StockMovement, {
                where: { referenceType: 'sale', referenceId: sale.id },
                relations: ['stock']
            });
            const physicalReserveMovements = reserveMovements.filter(m => m.stock && String(m.stock.departmentId) !== String(sanalDeptId));
            const deptUnreserves = new Map();
            for (const mov of physicalReserveMovements) {
                const stock = mov.stock;
                if (!stock)
                    continue;
                const deptId = stock.departmentId;
                const list = deptUnreserves.get(deptId) || [];
                list.push({ itemId: stock.itemId, quantity: mov.quantity });
                deptUnreserves.set(deptId, list);
            }
            if (sale.items && sale.items.length > 0) {
                for (const item of sale.items) {
                    await this.stocksService.increaseStock(String(item.itemId), sanalDeptId, item.quantity, item.costPrice || 0, manager, {
                        type: 'revert',
                        id: sale.id,
                        description: `Sanal Stok İptal İadesi: ${sale.code}`
                    }, userId);
                }
            }
            for (const [deptId, items] of deptUnreserves.entries()) {
                if (items.length > 0) {
                    const itemsToRelease = items.map(item => ({
                        itemId: item.itemId,
                        quantity: new decimal_js_1.Decimal(item.quantity).toNumber()
                    }));
                    await this.stocksService.releaseStockBulk(itemsToRelease, deptId, manager, {
                        type: 'revert',
                        id: sale.id,
                        description: `Sipariş İptali Rezervasyon İadesi: ${sale.code}`
                    }, userId);
                }
            }
        });
    }
};
exports.InventorySaleListener = InventorySaleListener;
exports.InventorySaleListener = InventorySaleListener = InventorySaleListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stocks_service_1.StocksService,
        typeorm_1.DataSource,
        rabbitmq_service_1.RabbitMQService])
], InventorySaleListener);
//# sourceMappingURL=inventory-sale.listener.js.map