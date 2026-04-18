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

  /**
   * [TASK-006] Decimal Payload Standartı
   * Türkçe VEYA Amerikan formatlı sayı string'ini "1234567.89" biçiminde döndürür.
   * Geçersiz girişte null döner.
   */
  static parseTurkishDecimal(input: string): string | null {
    if (!input || typeof input !== 'string') return null;

    // Boşluk ve para birimi sembollerini temizle
    let s = input.replace(/[\s₺$€£]/g, '');

    const commaCount = (s.match(/,/g) ?? []).length;
    const dotCount = (s.match(/\./g) ?? []).length;

    // 1. Düz tam sayı: "1000"
    if (commaCount === 0 && dotCount === 0) {
      return s;
    }

    // 2. Amerikan ondalık: "1000.50"
    if (commaCount === 0 && dotCount === 1) {
      return s;
    }

    // 3. Türkçe ondalık: "1000,50"
    if (dotCount === 0 && commaCount === 1) {
      return s.replace(',', '.');
    }

    // 4. Binlik ayıraç + ondalık
    // Türkçe format: "1.000.000,50" → son ayıraç ','
    const turkishRegex = /^[0-9.]+,[0-9]{1,2}$/;
    if (turkishRegex.test(s)) {
      const lastCommaIdx = s.lastIndexOf(',');
      const intPart = s.slice(0, lastCommaIdx).replace(/\./g, '');
      const decPart = s.slice(lastCommaIdx + 1);
      return `${intPart}.${decPart}`;
    }

    // Amerikan format: "1,000,000.50" → son ayıraç '.'
    const americanRegex = /^[0-9,]+\.[0-9]{1,2}$/;
    if (americanRegex.test(s)) {
      const lastDotIdx = s.lastIndexOf('.');
      const intPart = s.slice(0, lastDotIdx).replace(/,/g, '');
      const decPart = s.slice(lastDotIdx + 1);
      return `${intPart}.${decPart}`;
    }

    return null;
  }
}
