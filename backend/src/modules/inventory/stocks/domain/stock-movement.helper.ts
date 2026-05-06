import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { FinanceHelper } from '../../../../common/utils/finance.helper';

export class StockMovementHelper {
  static applyMovement(params: {
    stock: Stock;
    quantity: Decimal;
    type: 'in' | 'out';
    referenceInfo?: { type: StockMovement['referenceType']; id: string; description: string };
    userId?: string;
    manager: EntityManager;
  }): StockMovement {
    const { stock, quantity, type, referenceInfo, userId, manager } = params;

    const quantityBefore = new Decimal(stock.quantity);
    let quantityAfter: Decimal;

    if (type === 'in') {
      quantityAfter = quantityBefore.add(quantity);
    } else {
      quantityAfter = quantityBefore.sub(quantity);
    }

    stock.quantity = quantityAfter;
    stock.updatedBy = userId || null;

    const unitCost = new Decimal(stock.item?.movingAverageCost || 0);
    const totalCost = quantity.mul(unitCost);

    return manager.create(StockMovement, {
      stockId: stock.id,
      quantity,
      quantityBefore,
      quantityAfter,
      unitCost,
      totalCost,
      type,
      referenceType: referenceInfo?.type || 'manual',
      referenceId: referenceInfo?.id || null,
      description: referenceInfo?.description || (type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'),
      createdBy: userId,
    });
  }

  static validateStockLimit(itemId: string, departmentId: string, currentQty: Decimal, delta: Decimal, limit: number = -100) {
    const after = currentQty.sub(delta);
    if (after.lt(limit)) {
      throw new BadRequestException(`Yetersiz stok limitleri aşıldı (${limit} sınırı). Ürün ID: ${itemId}`);
    }
  }
}
