"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceHelper = void 0;
const decimal_js_1 = require("decimal.js");
class FinanceHelper {
    static add(a, b) {
        return new decimal_js_1.Decimal(a).add(new decimal_js_1.Decimal(b));
    }
    static sub(a, b) {
        return new decimal_js_1.Decimal(a).sub(new decimal_js_1.Decimal(b));
    }
    static mul(a, b) {
        return new decimal_js_1.Decimal(a).mul(new decimal_js_1.Decimal(b));
    }
    static div(a, b, decimals = 4) {
        const divisor = new decimal_js_1.Decimal(b);
        if (divisor.isZero()) {
            throw new Error('FINANCE_DIVISION_BY_ZERO: Divisor cannot be zero');
        }
        return new decimal_js_1.Decimal(a).div(divisor).toDecimalPlaces(decimals, decimal_js_1.Decimal.ROUND_HALF_UP);
    }
    static transformString({ value }) {
        if (value === null || value === undefined)
            return '0';
        return String(value);
    }
    static transform({ value }) {
        try {
            if (value === null || value === undefined || value === '')
                return new decimal_js_1.Decimal(0);
            return new decimal_js_1.Decimal(value);
        }
        catch {
            return new decimal_js_1.Decimal(0);
        }
    }
    static toDecimal(value) {
        try {
            return new decimal_js_1.Decimal(value || 0);
        }
        catch {
            return new decimal_js_1.Decimal(0);
        }
    }
    static round(value, decimals = 2) {
        return new decimal_js_1.Decimal(value).toDecimalPlaces(decimals, decimal_js_1.Decimal.ROUND_HALF_UP);
    }
    static calculateKdv(amount, rate) {
        const amt = new decimal_js_1.Decimal(amount);
        const r = new decimal_js_1.Decimal(rate);
        return amt.mul(r).div(100).toDecimalPlaces(2, decimal_js_1.Decimal.ROUND_HALF_UP);
    }
}
exports.FinanceHelper = FinanceHelper;
//# sourceMappingURL=finance.helper.js.map