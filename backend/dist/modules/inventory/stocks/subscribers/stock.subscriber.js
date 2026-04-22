"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockSubscriber = void 0;
const typeorm_1 = require("typeorm");
const stock_entity_1 = require("../entities/stock.entity");
const item_entity_1 = require("../../items/entities/item.entity");
const decimal_js_1 = require("decimal.js");
let StockSubscriber = class StockSubscriber {
    listenTo() {
        return stock_entity_1.Stock;
    }
    async afterInsert(event) {
        await this.updateItemTotalStock(event.entity.itemId, event);
    }
    async afterUpdate(event) {
        if (event.entity && event.entity.itemId) {
            await this.updateItemTotalStock(event.entity.itemId, event);
        }
    }
    async afterRemove(event) {
        if (event.entityId) {
            const stock = await event.manager.getRepository(stock_entity_1.Stock).findOne({ where: { id: event.entityId } });
            if (stock) {
                await this.updateItemTotalStock(stock.itemId, event);
            }
        }
    }
    async updateItemTotalStock(itemId, event) {
        const manager = event.manager;
        const result = await manager.getRepository(stock_entity_1.Stock)
            .createQueryBuilder('stock')
            .select('SUM(stock.quantity)', 'total')
            .where('stock.item_id = :itemId', { itemId })
            .getRawOne();
        const total = new decimal_js_1.Decimal(result?.total || 0);
        await manager.getRepository(item_entity_1.Item).update(itemId, {
            totalStock: total
        });
    }
};
exports.StockSubscriber = StockSubscriber;
exports.StockSubscriber = StockSubscriber = __decorate([
    (0, typeorm_1.EventSubscriber)()
], StockSubscriber);
//# sourceMappingURL=stock.subscriber.js.map