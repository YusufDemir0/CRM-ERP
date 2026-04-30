import { Decimal } from 'decimal.js';
export declare class FinanceHelper {
    static add(a: Decimal | number | string, b: Decimal | number | string): Decimal;
    static sub(a: Decimal | number | string, b: Decimal | number | string): Decimal;
    static mul(a: Decimal | number | string, b: Decimal | number | string): Decimal;
    static div(a: Decimal | number | string, b: Decimal | number | string, decimals?: number): Decimal;
    static transformString({ value }: any): string;
    static transform({ value }: any): Decimal;
    static toDecimal(value: any): Decimal;
    static round(value: Decimal | number | string, decimals?: number): Decimal;
    static calculateKdv(amount: Decimal | number | string, rate: number): Decimal;
}
