import { Decimal } from 'decimal.js';
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
export declare class SaleCalculator {
    static calculate(inputLines: InputSaleLine[], itemDataMap: Map<string, ItemData>, headerDiscountAmount?: number | Decimal | string, headerDiscountPercent?: number | Decimal | string, isRetail?: boolean): CalculationResult;
}
