import { Decimal } from 'decimal.js';

/**
 * Enterprise Finance Helper
 * Pure Utility - No Framework Dependencies (NestJS, Express, etc.)
 */
export class FinanceHelper {
  static add(a: Decimal | number | string, b: Decimal | number | string): Decimal {
    return new Decimal(a).add(new Decimal(b));
  }

  static sub(a: Decimal | number | string, b: Decimal | number | string): Decimal {
    return new Decimal(a).sub(new Decimal(b));
  }

  static mul(a: Decimal | number | string, b: Decimal | number | string): Decimal {
    return new Decimal(a).mul(new Decimal(b));
  }

  static div(a: Decimal | number | string, b: Decimal | number | string, decimals: number = 4): Decimal {
    const divisor = new Decimal(b);
    if (divisor.isZero()) {
      throw new Error('FINANCE_DIVISION_BY_ZERO: Divisor cannot be zero');
    }
    return new Decimal(a).div(divisor).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  }

  /**
   * Used for class-transformer @Transform to return a string
   */
  static transformString({ value }: { value: unknown }): string {
    if (value === null || value === undefined) return '0';
    return String(value);
  }

  /**
   * Used for class-transformer @Transform to return a Decimal
   */
  static transform({ value }: { value: unknown }): Decimal {
    try {
      if (value === null || value === undefined || value === '') return new Decimal(0);
      return new Decimal(value as import('decimal.js').Decimal.Value);
    } catch {
      return new Decimal(0);
    }
  }

  static toDecimal(value: unknown): Decimal {
    try {
      return new Decimal((value as import('decimal.js').Decimal.Value) || 0);
    } catch {
      return new Decimal(0);
    }
  }

  static round(value: Decimal | number | string, decimals: number = 2): Decimal {
    return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  }

  static calculateKdv(amount: Decimal | number | string, rate: Decimal | number | string): Decimal {
    const amt = new Decimal(amount);
    const r = new Decimal(rate);
    return amt.mul(r).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }
}
