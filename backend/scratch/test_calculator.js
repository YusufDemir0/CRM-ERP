
const { Decimal } = require('decimal.js');

// Mock FinanceHelper for standalone test
const FH = {
  add: (a, b) => new Decimal(a).add(b),
  sub: (a, b) => new Decimal(a).sub(b),
  mul: (a, b) => new Decimal(a).mul(b),
  div: (a, b, p) => new Decimal(a).div(b).toDecimalPlaces(p || 10),
  round: (a) => new Decimal(a).toDecimalPlaces(2),
  calculateKdv: (amount, rate) => new Decimal(amount).mul(rate).div(100).toDecimalPlaces(2)
};

class SaleCalculator {
  static calculate(inputLines, itemDataMap, headerDiscountAmount = 0, headerDiscountPercent = 0) {
    const hDiscountAmount = new Decimal(headerDiscountAmount);
    const hDiscountPercent = new Decimal(headerDiscountPercent);
    
    let rawTotalAmount = new Decimal(0);
    let totalCost = new Decimal(0);
    const lines = [];

    for (const input of inputLines) {
      const item = itemDataMap.get(input.itemId);
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
        kdvAmount: new Decimal(0),
        lineTotal: new Decimal(0)
      });
    }

    let discountToSubtract = hDiscountAmount;
    if (hDiscountPercent.gt(0)) {
      discountToSubtract = FH.mul(rawTotalAmount, hDiscountPercent.div(100));
    }

    const discountedMatrah = FH.sub(rawTotalAmount, discountToSubtract);

    let totalKdv = new Decimal(0);
    let distributedMatrah = new Decimal(0);

    lines.forEach((line, index) => {
      const isLast = index === lines.length - 1;
      let lineMatrah;
      if (isLast && lines.length > 0) {
        lineMatrah = discountedMatrah.minus(distributedMatrah);
      } else {
        const lineRatio = rawTotalAmount.gt(0) 
          ? FH.div(FH.mul(line.quantity, line.netPrice), rawTotalAmount, 10) 
          : new Decimal(0);
        lineMatrah = FH.round(discountedMatrah.mul(lineRatio));
        distributedMatrah = distributedMatrah.plus(lineMatrah);
      }

      const lineKdv = FH.calculateKdv(lineMatrah, Number(line.kdvRate));
      line.kdvAmount = lineKdv;
      line.lineTotal = FH.add(lineMatrah, lineKdv);
      totalKdv = FH.add(totalKdv, lineKdv);
    });

    const grandTotal = FH.add(discountedMatrah, totalKdv);

    return {
      totalAmount: rawTotalAmount,
      grandTotal,
      totalCost,
      profit: grandTotal.sub(totalCost),
      lines,
    };
  }
}

// TEST CASE
const itemDataMap = new Map();
itemDataMap.set(1, { id: 1, salePrice: 100, purchasePrice: 60 });
itemDataMap.set(2, { id: 2, salePrice: 200, purchasePrice: 120 });

const inputLines = [
  { itemId: 1, quantity: 2, kdvRate: 20 },
  { itemId: 2, quantity: 1, kdvRate: 20 }
];

const result = SaleCalculator.calculate(inputLines, itemDataMap);

console.log("--- TEST RESULTS ---");
console.log("Total Amount (Raw):", result.totalAmount.toString()); // Expected: 2*100 + 1*200 = 400
console.log("Total Cost:", result.totalCost.toString()); // Expected: 2*60 + 1*120 = 240
console.log("Grand Total (inc KDV):", result.grandTotal.toString()); // Expected: 400 * 1.2 = 480
console.log("Profit:", result.profit.toString()); // Expected: 480 - 240 = 240
console.log("--------------------");

if (result.totalAmount.equals(400) && result.totalCost.equals(240) && result.grandTotal.equals(480) && result.profit.equals(240)) {
  console.log("✅ TEST PASSED: Calculation logic is correct.");
} else {
  console.log("❌ TEST FAILED: Calculation logic discrepancy found.");
  process.exit(1);
}
