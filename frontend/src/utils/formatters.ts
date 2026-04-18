import { Decimal } from 'decimal.js';

/**
 * formatCurrency
 * Formats a number or string as TRY currency.
 * [TASK-17]: Moved from DashboardPage.tsx to centralized utilities.
 */
export const formatCurrency = (val: number | string | null | undefined) => {
  const num = new Decimal(val || 0);
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num.toNumber());
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
