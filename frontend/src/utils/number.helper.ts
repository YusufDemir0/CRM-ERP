import { Decimal } from 'decimal.js';

/**
 * FE-09: Universal Decimal Parser (TR Locale Aware)
 * FIXED: Uses Decimal.js instead of parseFloat to prevent floating-point rounding errors.
 * Handles "1.234,56", "1234,56", "1234.56" and converts to a safe Decimal number.
 */
export const parseTurkishDecimal = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  let sanitized = val.toString().trim();
  
  if (sanitized.includes(',') && sanitized.includes('.')) {
    // Mixed format: 1.234,56 -> remove . and replace , with .
    sanitized = sanitized.replace(/\./g, '').replace(',', '.');
  } else if (sanitized.includes(',')) {
    // Only comma: 1234,56 -> replace , with .
    sanitized = sanitized.replace(',', '.');
  } 
  // If only dot exists (1234.56), it's already in standard format.

  try {
    return new Decimal(sanitized).toNumber();
  } catch {
    return 0;
  }
};

/**
 * Parses a Turkish-formatted string directly to a Decimal object.
 * Use this for intermediate calculations where precision matters.
 */
export const parseTurkishToDecimal = (val: string | number): Decimal => {
  if (typeof val === 'number') return new Decimal(val);
  if (!val) return new Decimal(0);

  let sanitized = val.toString().trim();
  
  if (sanitized.includes(',') && sanitized.includes('.')) {
    sanitized = sanitized.replace(/\./g, '').replace(',', '.');
  } else if (sanitized.includes(',')) {
    sanitized = sanitized.replace(',', '.');
  }

  try {
    return new Decimal(sanitized);
  } catch {
    return new Decimal(0);
  }
};

/**
 * Format a number for display in Turkish locale.
 * This is DISPLAY ONLY — never use the output for calculations.
 */
export const formatTurkishCurrency = (val: number | string, symbol: string = '₺'): string => {
  let num: number;
  try {
    num = new Decimal(val || 0).toNumber();
  } catch {
    num = 0;
  }
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(num).replace('₺', symbol);
};
