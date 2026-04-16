"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceHelper = void 0;
const decimal_js_1 = require("decimal.js");
class FinanceHelper {
    static round(value, decimals = this.DEFAULT_DECIMALS) {
        return new decimal_js_1.Decimal(value).toDecimalPlaces(decimals, decimal_js_1.Decimal.ROUND_HALF_UP);
    }
    static calculateKdv(matrah, rate) {
        const dMatrah = new decimal_js_1.Decimal(matrah);
        const dRate = new decimal_js_1.Decimal(rate).div(100);
        return this.round(dMatrah.mul(dRate));
    }
    static calculateTotal(matrah, rate) {
        const dMatrah = new decimal_js_1.Decimal(matrah);
        const kdv = this.calculateKdv(dMatrah, rate);
        return this.round(dMatrah.plus(kdv));
    }
    static add(a, b) {
        return new decimal_js_1.Decimal(a).plus(new decimal_js_1.Decimal(b));
    }
    static sub(a, b) {
        return new decimal_js_1.Decimal(a).minus(new decimal_js_1.Decimal(b));
    }
    static mul(a, b) {
        return new decimal_js_1.Decimal(a).mul(new decimal_js_1.Decimal(b));
    }
    static div(a, b, decimals = 4) {
        const dOut = new decimal_js_1.Decimal(b);
        if (dOut.isZero())
            return new decimal_js_1.Decimal(0);
        return new decimal_js_1.Decimal(a).div(dOut).toDecimalPlaces(decimals, decimal_js_1.Decimal.ROUND_HALF_UP);
    }
}
exports.FinanceHelper = FinanceHelper;
FinanceHelper.DEFAULT_DECIMALS = 2;
//# sourceMappingURL=finance.helper.js.map