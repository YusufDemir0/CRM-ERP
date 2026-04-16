/**
 * FE-09: Universal Decimal Parser (TR Locale Aware)
 * Handles "1.234,56", "1234,56", "1234.56" and converts to standard float string/number.
 */
export const parseTurkishDecimal = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  // 1. Remove thousand separators (dots followed by 3 digits)
  // But wait, "1.234" could be 1234 or 1.234 in different contexts.
  // In TR locale, "1.234,56": . is thousand, , is decimal.
  // If there's a comma, we assume Turkish format.
  
  let sanitized = val.toString().trim();
  
  if (sanitized.includes(',') && sanitized.includes('.')) {
    // Mixed format: 1.234,56 -> remove . and replace , with .
    sanitized = sanitized.replace(/\./g, '').replace(',', '.');
  } else if (sanitized.includes(',')) {
    // Only comma: 1234,56 -> replace , with .
    sanitized = sanitized.replace(',', '.');
  } 
  // If only dot exists (1234.56), it's already in standard format.

  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatTurkishCurrency = (val: number | string, symbol: string = '₺'): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(num || 0).replace('₺', symbol);
};
