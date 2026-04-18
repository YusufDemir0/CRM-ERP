import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateTrend, formatPhoneNumber } from './formatters';

describe('formatters utility', () => {
  describe('formatCurrency', () => {
    it('should format numbers correctly for Turkish locale', () => {
      // Note: Intl formatting results can vary slightly by environment, 
      // but we expect something like "₺1.235" or "1.235 ₺"
      const result = formatCurrency(1234.56);
      expect(result).toContain('₺');
      expect(result).toContain('1.23');
    });

    it('should handle string inputs', () => {
      expect(formatCurrency('1000')).toContain('1.000');
    });

    it('should default to ₺0 for null/undefined', () => {
      expect(formatCurrency(null)).toContain('0');
      expect(formatCurrency(undefined)).toContain('0');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate positive trend correctly', () => {
      expect(calculateTrend(150, 100)).toBe(50);
    });

    it('should calculate negative trend correctly', () => {
      expect(calculateTrend(80, 100)).toBe(-20);
    });

    it('should handle zero previous value', () => {
      expect(calculateTrend(100, 0)).toBe(100);
      expect(calculateTrend(0, 0)).toBe(0);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10 digit numbers correctly', () => {
      expect(formatPhoneNumber('5321234567')).toBe('532 123 45 67');
    });

    it('should remove leading zero', () => {
      expect(formatPhoneNumber('05321234567')).toBe('532 123 45 67');
    });

    it('should handle partial numbers', () => {
      expect(formatPhoneNumber('532')).toBe('532');
      expect(formatPhoneNumber('532123')).toBe('532 123');
    });
  });
});
