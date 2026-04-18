import { Decimal } from 'decimal.js';

/**
 * Türkçe VEYA Amerikan formatlı sayı string'ini
 * "1234567.89" biçiminde döndürür (parseFloat KULLANILMAZ).
 * Geçersiz girişte null döner — caller exception fırlatmalı.
 */
export function parseTurkishDecimal(input: any): string | null {
  if (input === undefined || input === null) return null;
  let s = input.toString();

  // 1. Boşluk ve para birimi sembollerini temizle
  s = s.replace(/[\s₺$€£]/g, '');

  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount   = (s.match(/\./g) ?? []).length;

  // 2. Format tespiti
  if (commaCount === 0 && dotCount === 0) {
    // Düz tam sayı: "1000"
    return s;
  }

  if (commaCount === 0 && dotCount === 1) {
    // Amerikan ondalık: "1000.50"
    return s;
  }

  if (dotCount === 0 && commaCount === 1) {
    // Türkçe ondalık: "1000,50"
    return s.replace(',', '.');
  }

  // 3. Binlik ayıraç + ondalık
  // Türkçe format: "1.000.000,50" → son ayıraç ','
  if (s.endsWith((/,\d{1,2}$/.exec(s)?.[0] ?? ''))) {
    const lastCommaIdx = s.lastIndexOf(',');
    const intPart = s.slice(0, lastCommaIdx).replace(/\./g, '');
    const decPart = s.slice(lastCommaIdx + 1);
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
    return `${intPart}.${decPart}`;
  }

  // Amerikan format: "1,000,000.50" → son ayıraç '.'
  if (s.endsWith((/\.\d{1,2}$/.exec(s)?.[0] ?? ''))) {
    const lastDotIdx = s.lastIndexOf('.');
    const intPart = s.slice(0, lastDotIdx).replace(/,/g, '');
    const decPart = s.slice(lastDotIdx + 1);
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
    return `${intPart}.${decPart}`;
  }

  return null; // Tanımsız format
}

/**
 * Class-transformer Transform decorator'ı için yardımcı fonksiyon.
 * Giriş tipinden bağımsız olarak Decimal döner.
 */
export function transformDecimal({ value }: { value: any }): Decimal | string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseTurkishDecimal(value);
  if (parsed === null) return value; // Validator hata fırlatsın diye orjinalini dön
  return new Decimal(parsed);
}

/**
 * Class-transformer Transform decorator'ı için yardımcı fonksiyon (string döner).
 */
export function transformDecimalString({ value }: { value: any }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseTurkishDecimal(value);
  return parsed || value;
}
