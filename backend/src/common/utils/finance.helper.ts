import { Decimal } from 'decimal.js';

/**
 * FinanceHelper — ERP standartlarında yüksek hassasiyetli finansal hesaplamalar sağlar.
 * JavaScript'in float hatalarını önlemek için decimal.js kullanır.
 */
export class FinanceHelper {
  private static readonly DEFAULT_DECIMALS = 2;

  /**
   * Sayıyı belirtilen ondalık basamağa yuvarlar (Decimal nesnesi olarak).
   */
  static round(value: Decimal | number | string, decimals: number = this.DEFAULT_DECIMALS): Decimal {
    return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  }

  /**
   * KDV tutarını hesaplar.
   */
  static calculateKdv(matrah: Decimal | number | string, rate: number): Decimal {
    const dMatrah = new Decimal(matrah);
    const dRate = new Decimal(rate).div(100);
    return this.round(dMatrah.mul(dRate));
  }

  /**
   * Toplam tutarı (Matrah + KDV) hesaplar.
   */
  static calculateTotal(matrah: Decimal | number | string, rate: number): Decimal {
    const dMatrah = new Decimal(matrah);
    const kdv = this.calculateKdv(dMatrah, rate);
    return this.round(dMatrah.plus(kdv));
  }

  /**
   * Güvenli Toplama
   */
  static add(a: Decimal | number | string, b: Decimal | number | string): Decimal {
    return new Decimal(a).plus(new Decimal(b));
  }

  /**
   * Güvenli Çıkarma
   */
  static sub(a: Decimal | number | string, b: Decimal | number | string): Decimal {
    return new Decimal(a).minus(new Decimal(b));
  }

  /**
   * Güvenli Çarpma
   */
  static mul(a: Decimal | number | string, b: Decimal | number | string): Decimal {
    return new Decimal(a).mul(new Decimal(b));
  }

  /**
   * Güvenli Bölme
   */
  static div(a: Decimal | number | string, b: Decimal | number | string, decimals: number = 4): Decimal {
    const dOut = new Decimal(b);
    if (dOut.isZero()) return new Decimal(0);
    return new Decimal(a).div(dOut).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  }
}
