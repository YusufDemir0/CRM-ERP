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

    let defaultDesc = type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı';
    if (referenceInfo?.type === 'create') defaultDesc = 'Yeni Ürün Eklendi';
    else if (referenceInfo?.type === 'production') defaultDesc = 'Üretim Yapıldı';
    else if (referenceInfo?.type === 'import') defaultDesc = 'İthal Edildi';

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
      description: referenceInfo?.description || defaultDesc,
      createdBy: userId,
    });
  }

  static validateStockLimit(
    itemId: string,
    departmentId: string,
    currentQty: Decimal,
    delta: Decimal,
    allowNegative = false,
  ) {
    const after = currentQty.sub(delta);
    if (after.lt(0) && !allowNegative) {
      throw new BadRequestException(
        `Yetersiz Stok! Ürün ID: ${itemId}, Depo ID: ${departmentId}. Mevcut Stok: ${currentQty.toString()}, Çıkış Yapılmak İstenen: ${delta.toString()}, Kalan: ${after.toString()}`
      );
    }
  }
}
