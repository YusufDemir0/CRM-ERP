import { Decimal } from 'decimal.js';
import { FinanceHelper as FH } from '../../../common/utils/finance.helper';

export interface CalculatedSaleLine {
  itemId: string;
  quantity: Decimal;
  price: Decimal;
  costPrice: Decimal;
  discountAmount: Decimal;
  discountPercent: Decimal;
  netPrice: Decimal;
  kdvRate: Decimal;
  kdvAmount: Decimal;
  lineTotal: Decimal;
  description?: string;
}

export interface CalculationResult {
  totalAmount: Decimal;
  discountAmount: Decimal;
  discountPercent: Decimal;
  kdv: Decimal;
  grandTotal: Decimal;
  totalCost: Decimal;
  profit: Decimal;
  lines: CalculatedSaleLine[];
}

export interface InputSaleLine {
  itemId: string;
  quantity: number | Decimal | string;
  kdvRate?: number | Decimal | string;
  discountAmount?: number | Decimal | string;
  discountPercent?: number | Decimal | string;
  description?: string;
}

export interface ItemData {
  id: string;
  salePrice: number | Decimal;
  purchasePrice: number | Decimal;
}

export class SaleCalculator {
  /**
   * Performs enterprise-grade financial calculations for a sale.
   * Logic includes line-level discounts, distributed matrah, and penny rounding.
   */
  static calculate(
    inputLines: InputSaleLine[],
    itemDataMap: Map<string, ItemData>,
    headerDiscountAmount: number | Decimal | string = 0,
    headerDiscountPercent: number | Decimal | string = 0,
  ): CalculationResult {
    const hDiscountAmount = new Decimal(headerDiscountAmount);
    const hDiscountPercent = new Decimal(headerDiscountPercent);
    
    let rawTotalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    const lines: CalculatedSaleLine[] = [];

    // 1. Initial Line Calculations (Net Price & Subtotal)
    for (const input of inputLines) {
      const item = itemDataMap.get(input.itemId);
      if (!item) throw new Error(`Item data missing for ID ${input.itemId}`);

      const unitPrice = new Decimal(item.salePrice || 0);
      const purchasePrice = new Decimal(item.purchasePrice || 0);
      const qty = new Decimal(input.quantity);
      const dAmount = new Decimal(input.discountAmount || 0);
      const dPercent = new Decimal(input.discountPercent || 0);

      let netPrice = unitPrice;
      if (dAmount.gt(0)) {
        netPrice = FH.sub(netPrice, dAmount);
      } else if (dPercent.gt(0)) {
        const discount = FH.mul(netPrice, dPercent.div(100));
        netPrice = FH.sub(netPrice, discount);
      }

      const lineSubtotal = FH.mul(qty, netPrice);
      rawTotalAmount = FH.add(rawTotalAmount, lineSubtotal);
      totalCost = FH.add(totalCost, FH.mul(qty, purchasePrice));

      lines.push({
        itemId: input.itemId,
        quantity: qty,
        price: unitPrice,
        costPrice: purchasePrice,
        discountAmount: dAmount,
        discountPercent: dPercent,
        netPrice,
        kdvRate: new Decimal(input.kdvRate ?? 20),
        kdvAmount: new Decimal(0), // Calculated in next step
        lineTotal: new Decimal(0), // Calculated in next step
        description: input.description,
      });
    }

    // 2. Header Discount Distribution
    let discountToSubtract = hDiscountAmount;
    if (hDiscountPercent.gt(0)) {
      discountToSubtract = FH.mul(rawTotalAmount, hDiscountPercent.div(100));
    }

    const discountedMatrah = FH.sub(rawTotalAmount, discountToSubtract);

    // 3. Matrah Distribution & KDV
    let totalKdv = new Decimal(0);
    let distributedMatrah = new Decimal(0);
    let maxLineIndex = 0;
    let maxLineAmount = new Decimal(0);

    lines.forEach((line, index) => {
      const isLast = index === lines.length - 1;
      
      let lineMatrah: Decimal;
      if (isLast && lines.length > 0) {
        lineMatrah = discountedMatrah.minus(distributedMatrah);
      } else {
        const lineRatio = rawTotalAmount.gt(0) 
          ? FH.div(FH.mul(line.quantity, line.netPrice), rawTotalAmount, 10) 
          : new Decimal(0);
        lineMatrah = FH.round(discountedMatrah.mul(lineRatio));
        distributedMatrah = distributedMatrah.plus(lineMatrah);
      }

      if (lineMatrah.gt(maxLineAmount)) {
        maxLineAmount = lineMatrah;
        maxLineIndex = index;
      }

      const lineKdv = FH.calculateKdv(lineMatrah, Number(line.kdvRate));
      line.kdvAmount = lineKdv;
      line.lineTotal = FH.add(lineMatrah, lineKdv);
      totalKdv = FH.add(totalKdv, lineKdv);
    });

    // 4. Penny Rounding Logic (Correct for floating point discrepancies in KDV distribution)
    const avgKdvRate = lines.length > 0 ? Number(lines[0].kdvRate) : 20;
    const expectedKdv = FH.calculateKdv(discountedMatrah, avgKdvRate);
    const difference = expectedKdv.sub(totalKdv);

    if (!difference.isZero() && lines.length > 0) {
      const targetLine = lines[maxLineIndex];
      targetLine.kdvAmount = FH.add(targetLine.kdvAmount, difference);
      targetLine.lineTotal = FH.add(targetLine.lineTotal, difference);
      totalKdv = expectedKdv;
    }

    const grandTotal = FH.add(discountedMatrah, totalKdv);

    return {
      totalAmount: rawTotalAmount,
      discountAmount: hDiscountAmount,
      discountPercent: hDiscountPercent,
      kdv: totalKdv,
      grandTotal,
      totalCost,
      profit: grandTotal.sub(totalCost),
      lines,
    };
  }
}
