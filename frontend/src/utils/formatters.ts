import Decimal from 'decimal.js';

/**
 * formatDecimal
 * Formats a Decimal/number/string value as TR locale string without precision loss.
 * Uses Decimal.toFixed() to get a safe string, then manually applies TR formatting.
 * NEVER calls .toNumber() — prevents IEEE-754 rounding for large values.
 */
export const formatDecimal = (val: any, decimals = 2): string => {
  if (val === null || val === undefined) return "0".padEnd(decimals > 0 ? decimals + 2 : 1, "0").replace(".", ",");
  
  try {
    // Handle case where backend sends a Decimal object state instead of string/number
    let safeVal = val;
    if (typeof val === 'object' && !Decimal.isDecimal(val)) {
      safeVal = val.toString() === '[object Object]' ? (val.value || 0) : val.toString();
    }
    
    const d = new Decimal(safeVal);
    const fixed = d.toFixed(decimals); // "1234567.89" — precision-safe string
    const [intPart, fracPart] = fixed.split('.');
    // TR locale: thousands separator is ".", decimal separator is ","
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return fracPart ? `${formattedInt},${fracPart}` : formattedInt;
  } catch (e) {
    console.warn("formatDecimal error for value:", val, e);
    return "0,00";
  }
};

/**
 * formatCurrency
 * Formats a number or string as TRY currency with full precision.
 * [TASK-17]: Moved from DashboardPage.tsx to centralized utilities.
 */
export const formatCurrency = (val: number | string | Decimal | null | undefined, symbol = '₺', decimals = 2) => {
  return `${formatDecimal(val, decimals)} ${symbol}`;
};

/**
 * calculateTrend
 * Calculates the percentage change between current and previous values.
 */
export const calculateTrend = (current: number, previous: number) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * formatPhoneNumber
 * Formats a raw digits string to "XXX XXX XX XX" pattern.
 */
export const formatPhoneNumber = (val: string) => {
  let d = val.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.substring(1);
  d = d.substring(0, 10);
  let res = '';
  if (d.length > 0) res += d.substring(0, 3);
  if (d.length > 3) res += ' ' + d.substring(3, 6);
  if (d.length > 6) res += ' ' + d.substring(6, 8);
  if (d.length > 8) res += ' ' + d.substring(8, 10);
  return res;
};
