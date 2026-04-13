export declare class FinanceHelper {
    private static readonly DEFAULT_DECIMALS;
    private static readonly PRECISION_DECIMALS;
    static round(value: number, decimals?: number): number;
    static calculateKdv(matrah: number, rate: number): number;
    static calculateTotal(matrah: number, rate: number): number;
    static add(a: number, b: number, decimals?: number): number;
    static sub(a: number, b: number, decimals?: number): number;
    static mul(a: number, b: number, decimals?: number): number;
    static div(a: number, b: number, decimals?: number): number;
}
