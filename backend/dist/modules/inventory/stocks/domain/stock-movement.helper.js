"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementHelper = void 0;
const decimal_js_1 = require("decimal.js");
const stock_movement_entity_1 = require("../entities/stock-movement.entity");
class StockMovementHelper {
    static applyMovement(params) {
        const { stock, quantity, type, referenceInfo, userId, manager } = params;
        const quantityBefore = new decimal_js_1.Decimal(stock.quantity);
        let quantityAfter;
        if (type === 'in') {
            quantityAfter = quantityBefore.add(quantity);
        }
        else {
            quantityAfter = quantityBefore.sub(quantity);
        }
        stock.quantity = quantityAfter;
        stock.updatedBy = userId || null;
        const unitCost = new decimal_js_1.Decimal(stock.item?.movingAverageCost || 0);
        const totalCost = quantity.mul(unitCost);
        let defaultDesc = type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı';
        if (referenceInfo?.type === 'create')
            defaultDesc = 'Yeni Ürün Eklendi';
        else if (referenceInfo?.type === 'production')
            defaultDesc = 'Üretim Yapıldı';
        else if (referenceInfo?.type === 'import')
            defaultDesc = 'İthal Edildi';
        return manager.create(stock_movement_entity_1.StockMovement, {
            stockId: stock.id,
            quantity,
            quantityBefore,
            quantityAfter,
            unitCost,
            totalCost,
            type,
            referenceType: referenceInfo?.type || 'manual',
            referenceId: referenceInfo?.id || null,
            description: referenceInfo?.description || defaultDesc,
            createdBy: userId,
        });
    }
    static validateStockLimit(itemId, departmentId, currentQty, delta) {
        const after = currentQty.sub(delta);
        if (after.lt(0)) {
            console.warn(`[STOK UYARISI] Stok seviyesi sıfırın altına düştü! Ürün ID: ${itemId}, Depo ID: ${departmentId}, Yeni Stok: ${after.toString()}`);
        }
    }
}
exports.StockMovementHelper = StockMovementHelper;
//# sourceMappingURL=stock-movement.helper.js.map