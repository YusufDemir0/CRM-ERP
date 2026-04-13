"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceHelper = void 0;
class FinanceHelper {
    static round(value, decimals = this.DEFAULT_DECIMALS) {
        const factor = Math.pow(10, decimals);
        return Math.round((value + Number.EPSILON) * factor) / factor;
    }
    static calculateKdv(matrah, rate) {
        return this.round(matrah * (rate / 100));
    }
    static calculateTotal(matrah, rate) {
        const kdv = this.calculateKdv(matrah, rate);
        return this.round(matrah + kdv);
    }
    static add(a, b, decimals = this.DEFAULT_DECIMALS) {
        return this.round(Number(a) + Number(b), decimals);
    }
    static sub(a, b, decimals = this.DEFAULT_DECIMALS) {
        return this.round(Number(a) - Number(b), decimals);
    }
    static mul(a, b, decimals = this.DEFAULT_DECIMALS) {
        return this.round(Number(a) * Number(b), decimals);
    }
    static div(a, b, decimals = this.DEFAULT_DECIMALS) {
        if (Number(b) === 0)
            return 0;
        return this.round(Number(a) / Number(b), decimals);
    }
}
exports.FinanceHelper = FinanceHelper;
FinanceHelper.DEFAULT_DECIMALS = 2;
FinanceHelper.PRECISION_DECIMALS = 4;
//# sourceMappingURL=finance.helper.js.map