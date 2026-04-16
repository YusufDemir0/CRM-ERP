import { Decimal } from 'decimal.js';
export declare class FinanceHelper {
    private static readonly DEFAULT_DECIMALS;
    static round(value: Decimal | number | string, decimals?: number): Decimal;
    static calculateKdv(matrah: Decimal | number | string, rate: number): Decimal;
    static calculateTotal(matrah: Decimal | number | string, rate: number): Decimal;
    static add(a: Decimal | number | string, b: Decimal | number | string): Decimal;
    static sub(a: Decimal | number | string, b: Decimal | number | string): Decimal;
    static mul(a: Decimal | number | string, b: Decimal | number | string): Decimal;
    static div(a: Decimal | number | string, b: Decimal | number | string, decimals?: number): Decimal;
}
