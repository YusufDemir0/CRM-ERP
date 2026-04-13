/**
 * FinanceHelper — Provides robust rounding and basic arithmetic for currency.
 * Addresses floating-point arithmetic issues (e.g., 0.1 + 0.2 !== 0.3)
 * without requiring external big-decimal libraries.
 */
export class FinanceHelper {
  private static readonly DEFAULT_DECIMALS = 2;
  private static readonly PRECISION_DECIMALS = 4; // Use for unit prices

  /**
   * Rounds a number to a specific number of decimal places.
   * Uses Number.EPSILON to ensure correct rounding of edge cases.
   */
  static round(value: number, decimals: number = this.DEFAULT_DECIMALS): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  /**
   * Calculates KDV (VAT) amount.
   */
  static calculateKdv(matrah: number, rate: number): number {
    return this.round(matrah * (rate / 100));
  }

  /**
   * Calculates Total (Matrah + KDV).
   */
  static calculateTotal(matrah: number, rate: number): number {
    const kdv = this.calculateKdv(matrah, rate);
    return this.round(matrah + kdv);
  }

  /**
   * Safely adds two numbers and rounds them.
   */
  static add(a: number, b: number, decimals: number = this.DEFAULT_DECIMALS): number {
    return this.round(Number(a) + Number(b), decimals);
  }

  /**
   * Safely subtracts two numbers and rounds them.
   */
  static sub(a: number, b: number, decimals: number = this.DEFAULT_DECIMALS): number {
    return this.round(Number(a) - Number(b), decimals);
  }

  /**
   * Safely multiplies two numbers and rounds them.
   */
  static mul(a: number, b: number, decimals: number = this.DEFAULT_DECIMALS): number {
    return this.round(Number(a) * Number(b), decimals);
  }

  /**
   * Safely divides two numbers and rounds them.
   */
  static div(a: number, b: number, decimals: number = this.DEFAULT_DECIMALS): number {
    if (Number(b) === 0) return 0;
    return this.round(Number(a) / Number(b), decimals);
  }
}
