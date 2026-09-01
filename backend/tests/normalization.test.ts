import { Normalizer } from '../../src/utils/normalization';

describe('Normalizer', () => {
  describe('normalizeGstin', () => {
    it('should normalize GSTIN to uppercase', () => {
      const result = Normalizer.normalizeGstin('27aajcu9603r1z5');
      expect(result.value).toBe('27AAJCU9603R1Z5');
      expect(result.errors).toHaveLength(0);
    });

    it('should trim whitespace', () => {
      const result = Normalizer.normalizeGstin('  27AAJCU9603R1Z5  ');
      expect(result.value).toBe('27AAJCU9603R1Z5');
      expect(result.errors).toHaveLength(0);
    });

    it('should report error for invalid GSTIN', () => {
      const result = Normalizer.normalizeGstin('invalid');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errorType).toBe('INVALID_FORMAT');
    });

    it('should report error for missing GSTIN', () => {
      const result = Normalizer.normalizeGstin('');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errorType).toBe('MISSING_REQUIRED');
    });
  });

  describe('normalizeInvoiceNumber', () => {
    it('should normalize invoice number to uppercase', () => {
      const result = Normalizer.normalizeInvoiceNumber('inv-001');
      expect(result.value).toBe('INV-001');
      expect(result.errors).toHaveLength(0);
    });

    it('should remove brackets and parentheses', () => {
      const result = Normalizer.normalizeInvoiceNumber('INV(001)[A]');
      expect(result.value).toBe('INV001A');
      expect(result.errors).toHaveLength(0);
    });

    it('should normalize multiple spaces to single space', () => {
      const result = Normalizer.normalizeInvoiceNumber('INV    001');
      expect(result.value).toBe('INV 001');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('parseDate', () => {
    it('should parse DD/MM/YYYY format', () => {
      const result = Normalizer.parseDate('31/03/2024');
      expect(result.value).toBe('2024-03-31');
      expect(result.errors).toHaveLength(0);
    });

    it('should parse DD-MM-YYYY format', () => {
      const result = Normalizer.parseDate('31-03-2024');
      expect(result.value).toBe('2024-03-31');
      expect(result.errors).toHaveLength(0);
    });

    it('should parse YYYY-MM-DD format', () => {
      const result = Normalizer.parseDate('2024-03-31');
      expect(result.value).toBe('2024-03-31');
      expect(result.errors).toHaveLength(0);
    });

    it('should report error for invalid date format', () => {
      const result = Normalizer.parseDate('invalid-date');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errorType).toBe('INVALID_FORMAT');
    });
  });

  describe('parseNumeric', () => {
    it('should parse simple number', () => {
      const result = Normalizer.parseNumeric(1000.5, 'testField');
      expect(result.value).toBe(1000.5);
      expect(result.errors).toHaveLength(0);
    });

    it('should remove commas from string', () => {
      const result = Normalizer.parseNumeric('1,000.50', 'testField');
      expect(result.value).toBe(1000.5);
      expect(result.errors).toHaveLength(0);
    });

    it('should remove rupee symbol', () => {
      const result = Normalizer.parseNumeric('₹1000.50', 'testField');
      expect(result.value).toBe(1000.5);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty values', () => {
      const result = Normalizer.parseNumeric('', 'testField');
      expect(result.value).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should report error for invalid numeric', () => {
      const result = Normalizer.parseNumeric('not-a-number', 'testField');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errorType).toBe('INVALID_FORMAT');
    });
  });
});
