"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTurkishDecimal = parseTurkishDecimal;
exports.transformDecimal = transformDecimal;
exports.transformDecimalString = transformDecimalString;
const decimal_js_1 = require("decimal.js");
function parseTurkishDecimal(input) {
    if (input === undefined || input === null)
        return null;
    let s = input.toString();
    s = s.replace(/[\s₺$€£]/g, '');
    const commaCount = (s.match(/,/g) ?? []).length;
    const dotCount = (s.match(/\./g) ?? []).length;
    if (commaCount === 0 && dotCount === 0) {
        return s;
    }
    if (commaCount === 0 && dotCount === 1) {
        return s;
    }
    if (dotCount === 0 && commaCount === 1) {
        return s.replace(',', '.');
    }
    if (s.endsWith((/,\d{1,2}$/.exec(s)?.[0] ?? ''))) {
        const lastCommaIdx = s.lastIndexOf(',');
        const intPart = s.slice(0, lastCommaIdx).replace(/\./g, '');
        const decPart = s.slice(lastCommaIdx + 1);
        if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart))
            return null;
        return `${intPart}.${decPart}`;
    }
    if (s.endsWith((/\.\d{1,2}$/.exec(s)?.[0] ?? ''))) {
        const lastDotIdx = s.lastIndexOf('.');
        const intPart = s.slice(0, lastDotIdx).replace(/,/g, '');
        const decPart = s.slice(lastDotIdx + 1);
        if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart))
            return null;
        return `${intPart}.${decPart}`;
    }
    return null;
}
function transformDecimal({ value }) {
    if (value === undefined || value === null || value === '')
        return undefined;
    const parsed = parseTurkishDecimal(value);
    if (parsed === null)
        return value;
    return new decimal_js_1.Decimal(parsed);
}
function transformDecimalString({ value }) {
    if (value === undefined || value === null || value === '')
        return undefined;
    const parsed = parseTurkishDecimal(value);
    return (parsed || value);
}
//# sourceMappingURL=number.helper.js.map