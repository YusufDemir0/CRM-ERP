"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalTransformer = void 0;
const decimal_js_1 = require("decimal.js");
class DecimalTransformer {
    to(value) {
        if (value === null || value === undefined)
            return null;
        return value.toString();
    }
    from(value) {
        if (value === null || value === undefined)
            return null;
        return new decimal_js_1.Decimal(value);
    }
}
exports.DecimalTransformer = DecimalTransformer;
//# sourceMappingURL=decimal.transformer.js.map