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
    isRetail = false,
    representativePrice?: number | Decimal | string,
  ): CalculationResult {
    const hDiscountAmount = new Decimal(headerDiscountAmount);
    const hDiscountPercent = new Decimal(headerDiscountPercent);
    const targetGrandTotal = representativePrice !== undefined && representativePrice !== null && representativePrice !== '' ? new Decimal(representativePrice) : null;
    
    let rawTotalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    const lines: CalculatedSaleLine[] = [];

    // 1. Initial Line Calculations (Net Price & Subtotal)
    for (const input of inputLines) {
      const item = itemDataMap.get(input.itemId);
      if (!item) throw new Error(`Item data missing for ID ${input.itemId}`);

      // KDV Oranı: input'tan veya varsayılan %20
      const kdvRate = new Decimal(input.kdvRate ?? 20);
      const rawSalePrice = new Decimal(item.salePrice || 0);
      const purchasePrice = new Decimal(item.purchasePrice || 0);
      const qty = new Decimal(input.quantity);
      const dAmount = new Decimal(input.discountAmount || 0);
      const dPercent = new Decimal(input.discountPercent || 0);

      // Perakende satışta etiket fiyatı KDV Dahildir; net matrah ayrıştırılır (VUK standardı)
      const basePrice = isRetail
        ? rawSalePrice.div(new Decimal(1).add(kdvRate.div(100)))
        : rawSalePrice;

      // Mutually exclusive discount application
      let netPrice = basePrice;
      if (dAmount.gt(0)) {
        netPrice = FH.sub(netPrice, dAmount);
      } else if (dPercent.gt(0)) {
        const discount = FH.mul(basePrice, dPercent.div(100));
        netPrice = FH.sub(netPrice, discount);
      }

      const lineSubtotal = FH.mul(qty, netPrice);
      rawTotalAmount = FH.add(rawTotalAmount, lineSubtotal);
      totalCost = FH.add(totalCost, FH.mul(qty, purchasePrice));

      lines.push({
        itemId: input.itemId,
        quantity: qty,
        price: basePrice,
        costPrice: purchasePrice,
        discountAmount: dAmount,
        discountPercent: dPercent,
        netPrice,
        kdvRate,
        kdvAmount: new Decimal(0), // Calculated in next step
        lineTotal: new Decimal(0), // Calculated in next step
        description: input.description,
      });
    }

    // Check if targetGrandTotal is provided and greater than 0
    if (targetGrandTotal && targetGrandTotal.gt(0)) {
      // Calculate initial grand total (sum of lines' totals before target total)
      const initialGrandTotal = lines.reduce((acc, line) => {
        const lineInitialMatrah = line.quantity.mul(line.netPrice);
        const lineInitialKdv = FH.calculateKdv(lineInitialMatrah, line.kdvRate);
        return acc.add(lineInitialMatrah).add(lineInitialKdv);
      }, new Decimal(0));

      let distributedMatrah = new Decimal(0);
      let distributedKdv = new Decimal(0);
      let distributedTotal = new Decimal(0);
      let maxLineIndex = 0;
      let maxLineAmount = new Decimal(0);

      lines.forEach((line, index) => {
        const isLast = index === lines.length - 1;
        const lineInitialMatrah = line.quantity.mul(line.netPrice);
        const lineInitialKdv = FH.calculateKdv(lineInitialMatrah, line.kdvRate);
        const lineInitialTotal = lineInitialMatrah.plus(lineInitialKdv);

        let lineTargetTotal: Decimal;
        if (isLast) {
          lineTargetTotal = targetGrandTotal.minus(distributedTotal);
        } else {
          const lineRatio = initialGrandTotal.gt(0) ? lineInitialTotal.div(initialGrandTotal) : new Decimal(0);
          lineTargetTotal = FH.round(targetGrandTotal.mul(lineRatio));
          distributedTotal = distributedTotal.plus(lineTargetTotal);
        }

        // VUK Uygun: Her zaman hedeflenen brüt tutardan KDV ve Matrah orantısal ayrıştırılır
        const lineTargetMatrah = lineTargetTotal.div(new Decimal(1).add(line.kdvRate.div(100)));
        const lineTargetKdv = lineTargetTotal.minus(lineTargetMatrah);

        line.kdvAmount = lineTargetKdv;
        line.lineTotal = lineTargetTotal;

        distributedMatrah = distributedMatrah.plus(lineTargetMatrah);
        distributedKdv = distributedKdv.plus(lineTargetKdv);

        if (lineTargetMatrah.gt(maxLineAmount)) {
          maxLineAmount = lineTargetMatrah;
          maxLineIndex = index;
        }
      });

      const discountedMatrah = distributedMatrah;
      const totalKdv = distributedKdv;
      const grandTotal = targetGrandTotal;
      const discountAmount = rawTotalAmount.minus(discountedMatrah);
      const discountPercent = rawTotalAmount.gt(0) ? discountAmount.div(rawTotalAmount).mul(100) : new Decimal(0);

      return {
        totalAmount: rawTotalAmount,
        discountAmount,
        discountPercent,
        kdv: totalKdv,
        grandTotal,
        totalCost,
        profit: discountedMatrah.sub(totalCost),
        lines,
      };
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

      const lineKdv = FH.calculateKdv(lineMatrah, line.kdvRate);
      line.kdvAmount = lineKdv;
      line.lineTotal = FH.add(lineMatrah, lineKdv);
      totalKdv = FH.add(totalKdv, lineKdv);
    });

    // 4. Penny Rounding Logic (Only when all lines share the same KDV rate)
    const allSameRate = lines.length > 0 && lines.every(line => line.kdvRate.equals(lines[0].kdvRate));
    if (allSameRate && lines.length > 0) {
      const uniformRate = lines[0].kdvRate;
      const expectedKdv = FH.calculateKdv(discountedMatrah, uniformRate);
      const difference = expectedKdv.sub(totalKdv);

      if (!difference.isZero()) {
        const targetLine = lines[maxLineIndex];
        targetLine.kdvAmount = FH.add(targetLine.kdvAmount, difference);
        targetLine.lineTotal = FH.add(targetLine.lineTotal, difference);
        totalKdv = expectedKdv;
      }
    }

    const grandTotal = FH.add(discountedMatrah, totalKdv);

    return {
      totalAmount: rawTotalAmount,
      discountAmount: hDiscountAmount,
      discountPercent: hDiscountPercent,
      kdv: totalKdv,
      grandTotal,
      totalCost,
      profit: discountedMatrah.sub(totalCost),
      lines,
    };
  }
}
