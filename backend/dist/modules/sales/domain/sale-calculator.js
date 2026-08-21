"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleCalculator = void 0;
const decimal_js_1 = require("decimal.js");
const finance_helper_1 = require("../../../common/utils/finance.helper");
class SaleCalculator {
    static calculate(inputLines, itemDataMap, headerDiscountAmount = 0, headerDiscountPercent = 0, isRetail = false, representativePrice) {
        const hDiscountAmount = new decimal_js_1.Decimal(headerDiscountAmount);
        const hDiscountPercent = new decimal_js_1.Decimal(headerDiscountPercent);
        const targetGrandTotal = representativePrice !== undefined && representativePrice !== null && representativePrice !== '' ? new decimal_js_1.Decimal(representativePrice) : null;
        let rawTotalAmount = new decimal_js_1.Decimal(0);
        let totalCost = new decimal_js_1.Decimal(0);
        const lines = [];
        for (const input of inputLines) {
            const item = itemDataMap.get(input.itemId);
            if (!item)
                throw new Error(`Item data missing for ID ${input.itemId}`);
            const kdvRate = new decimal_js_1.Decimal(input.kdvRate ?? 20);
            const rawSalePrice = new decimal_js_1.Decimal(item.salePrice || 0);
            const purchasePrice = new decimal_js_1.Decimal(item.purchasePrice || 0);
            const qty = new decimal_js_1.Decimal(input.quantity);
            const dAmount = new decimal_js_1.Decimal(input.discountAmount || 0);
            const dPercent = new decimal_js_1.Decimal(input.discountPercent || 0);
            const basePrice = isRetail
                ? rawSalePrice.div(new decimal_js_1.Decimal(1).add(kdvRate.div(100)))
                : rawSalePrice;
            let netPrice = basePrice;
            if (dAmount.gt(0)) {
                netPrice = finance_helper_1.FinanceHelper.sub(netPrice, dAmount);
            }
            else if (dPercent.gt(0)) {
                const discount = finance_helper_1.FinanceHelper.mul(basePrice, dPercent.div(100));
                netPrice = finance_helper_1.FinanceHelper.sub(netPrice, discount);
            }
            const lineSubtotal = finance_helper_1.FinanceHelper.mul(qty, netPrice);
            rawTotalAmount = finance_helper_1.FinanceHelper.add(rawTotalAmount, lineSubtotal);
            totalCost = finance_helper_1.FinanceHelper.add(totalCost, finance_helper_1.FinanceHelper.mul(qty, purchasePrice));
            lines.push({
                itemId: input.itemId,
                quantity: qty,
                price: basePrice,
                costPrice: purchasePrice,
                discountAmount: dAmount,
                discountPercent: dPercent,
                netPrice,
                kdvRate,
                kdvAmount: new decimal_js_1.Decimal(0),
                lineTotal: new decimal_js_1.Decimal(0),
                description: input.description,
            });
        }
        if (targetGrandTotal && targetGrandTotal.gt(0)) {
            const initialGrandTotal = lines.reduce((acc, line) => {
                const lineInitialMatrah = line.quantity.mul(line.netPrice);
                const lineInitialKdv = finance_helper_1.FinanceHelper.calculateKdv(lineInitialMatrah, line.kdvRate);
                return acc.add(lineInitialMatrah).add(lineInitialKdv);
            }, new decimal_js_1.Decimal(0));
            let distributedMatrah = new decimal_js_1.Decimal(0);
            let distributedKdv = new decimal_js_1.Decimal(0);
            let distributedTotal = new decimal_js_1.Decimal(0);
            let maxLineIndex = 0;
            let maxLineAmount = new decimal_js_1.Decimal(0);
            lines.forEach((line, index) => {
                const isLast = index === lines.length - 1;
                const lineInitialMatrah = line.quantity.mul(line.netPrice);
                const lineInitialKdv = finance_helper_1.FinanceHelper.calculateKdv(lineInitialMatrah, line.kdvRate);
                const lineInitialTotal = lineInitialMatrah.plus(lineInitialKdv);
                let lineTargetTotal;
                if (isLast) {
                    lineTargetTotal = targetGrandTotal.minus(distributedTotal);
                }
                else {
                    const lineRatio = initialGrandTotal.gt(0) ? lineInitialTotal.div(initialGrandTotal) : new decimal_js_1.Decimal(0);
                    lineTargetTotal = finance_helper_1.FinanceHelper.round(targetGrandTotal.mul(lineRatio));
                    distributedTotal = distributedTotal.plus(lineTargetTotal);
                }
                const lineTargetMatrah = lineTargetTotal.div(new decimal_js_1.Decimal(1).add(line.kdvRate.div(100)));
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
            const discountPercent = rawTotalAmount.gt(0) ? discountAmount.div(rawTotalAmount).mul(100) : new decimal_js_1.Decimal(0);
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
        let discountToSubtract = hDiscountAmount;
        if (hDiscountPercent.gt(0)) {
            discountToSubtract = finance_helper_1.FinanceHelper.mul(rawTotalAmount, hDiscountPercent.div(100));
        }
        const discountedMatrah = finance_helper_1.FinanceHelper.sub(rawTotalAmount, discountToSubtract);
        let totalKdv = new decimal_js_1.Decimal(0);
        let distributedMatrah = new decimal_js_1.Decimal(0);
        let maxLineIndex = 0;
        let maxLineAmount = new decimal_js_1.Decimal(0);
        lines.forEach((line, index) => {
            const isLast = index === lines.length - 1;
            let lineMatrah;
            if (isLast && lines.length > 0) {
                lineMatrah = discountedMatrah.minus(distributedMatrah);
            }
            else {
                const lineRatio = rawTotalAmount.gt(0)
                    ? finance_helper_1.FinanceHelper.div(finance_helper_1.FinanceHelper.mul(line.quantity, line.netPrice), rawTotalAmount, 10)
                    : new decimal_js_1.Decimal(0);
                lineMatrah = finance_helper_1.FinanceHelper.round(discountedMatrah.mul(lineRatio));
                distributedMatrah = distributedMatrah.plus(lineMatrah);
            }
            if (lineMatrah.gt(maxLineAmount)) {
                maxLineAmount = lineMatrah;
                maxLineIndex = index;
            }
            const lineKdv = finance_helper_1.FinanceHelper.calculateKdv(lineMatrah, line.kdvRate);
            line.kdvAmount = lineKdv;
            line.lineTotal = finance_helper_1.FinanceHelper.add(lineMatrah, lineKdv);
            totalKdv = finance_helper_1.FinanceHelper.add(totalKdv, lineKdv);
        });
        const allSameRate = lines.length > 0 && lines.every(line => line.kdvRate.equals(lines[0].kdvRate));
        if (allSameRate && lines.length > 0) {
            const uniformRate = lines[0].kdvRate;
            const expectedKdv = finance_helper_1.FinanceHelper.calculateKdv(discountedMatrah, uniformRate);
            const difference = expectedKdv.sub(totalKdv);
            if (!difference.isZero()) {
                const targetLine = lines[maxLineIndex];
                targetLine.kdvAmount = finance_helper_1.FinanceHelper.add(targetLine.kdvAmount, difference);
                targetLine.lineTotal = finance_helper_1.FinanceHelper.add(targetLine.lineTotal, difference);
                totalKdv = expectedKdv;
            }
        }
        const grandTotal = finance_helper_1.FinanceHelper.add(discountedMatrah, totalKdv);
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
exports.SaleCalculator = SaleCalculator;
//# sourceMappingURL=sale-calculator.js.map