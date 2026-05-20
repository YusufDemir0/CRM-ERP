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
const rabbitmq_service_1 = require("../../../common/services/rabbitmq.service");
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
            const existingMovement = await manager.findOne(stock_movement_entity_1.StockMovement, {
                where: { referenceType: 'sale', referenceId: sale.id }
            });
            if (existingMovement) {
                this.logger.warn(`Idempotency: Inventory reservation for sale.id=${sale.id} already processed. Skipping.`);
                return;
            }
            await this.stocksService.reserveStockBulk(sale.items, departmentId, manager, { type: 'sale', id: sale.id, description: `Satış Onay Rezervasyonu: ${sale.code}` }, userId);
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
            await this.stocksService.revertStockMovementsByReference('sale', sale.id, manager, userId);
            const itemsToUnreserve = sale.items.map(si => {
                const qty = typeof si.quantity === 'object' && si.quantity !== null && 'minus' in si.quantity
                    ? si.quantity
                    : new (require('decimal.js').Decimal)(si.quantity);
                const shipped = typeof si.shippedQuantity === 'object' && si.shippedQuantity !== null && 'minus' in si.shippedQuantity
                    ? si.shippedQuantity
                    : new (require('decimal.js').Decimal)(si.shippedQuantity || 0);
                return {
                    itemId: String(si.itemId),
                    quantity: qty.minus(shipped)
                };
            }).filter(i => i.quantity.gt(0));
            if (itemsToUnreserve.length > 0) {
                await this.stocksService.unreserveStockBulk(itemsToUnreserve, sale.departmentId || '1', manager, userId);
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