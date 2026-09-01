import { ReconciliationEngine } from '../../src/utils/reconciliationEngine';
import { NormalizedInvoice, ReconciliationSettings } from '../../src/types';

const defaultSettings: ReconciliationSettings = {
  taxTolerance: 1,
  invoiceValueTolerance: 1,
  dateTolerance: 0,
  fuzzyMatchThreshold: 90
};

describe('ReconciliationEngine', () => {
  describe('Exact Matching', () => {
    it('should find exact invoice match', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.gstinSummary).toHaveLength(1);
      expect(result.gstinSummary[0].status).toBe('MATCHED');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchStatus).toBe('EXACT_MATCH');
    });

    it('should detect tax mismatch', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 200, // Different IGST
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1200
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchType).toBe('PARTIAL');
      expect(result.matches[0].matchStatus).toBe('IGST_MISMATCH');
    });
  });

  describe('Missing Invoices', () => {
    it('should detect invoice only in Books', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const gstr2b: NormalizedInvoice[] = [];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.gstinSummary[0].status).toBe('ONLY_IN_BOOKS');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchStatus).toBe('ONLY_IN_BOOKS');
    });

    it('should detect invoice only in GSTR-2B', () => {
      const books: NormalizedInvoice[] = [];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.gstinSummary[0].status).toBe('ONLY_IN_2B');
    });
  });

  describe('Tolerance Handling', () => {
    it('should match within tax tolerance', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 181, // 1 rupee difference
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1181
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.matches[0].matchStatus).toBe('EXACT_MATCH');
    });

    it('should fail to match outside tax tolerance', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 185, // 5 rupee difference (exceeds tolerance of 1)
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1185
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.matches[0].matchType).toBe('PARTIAL');
      expect(result.matches[0].matchStatus).toBe('IGST_MISMATCH');
    });
  });

  describe('GSTIN Matching', () => {
    it('should group by GSTIN', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        },
        {
          gstin: '18AABCR5055K1Z0',
          invoiceNumber: 'INV002',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier B',
          taxableValue: 2000,
          igst: 360,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 2360
        }
      ];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        },
        {
          gstin: '18AABCR5055K1Z0',
          invoiceNumber: 'INV002',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier B',
          taxableValue: 2000,
          igst: 360,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 2360
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.gstinSummary).toHaveLength(2);
      expect(result.gstinSummary[0].gstin).toBe('27AAJCU9603R1Z5');
      expect(result.gstinSummary[1].gstin).toBe('18AABCR5055K1Z0');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate invoices', () => {
      const books: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        },
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001', // Duplicate
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const gstr2b: NormalizedInvoice[] = [
        {
          gstin: '27AAJCU9603R1Z5',
          invoiceNumber: 'INV001',
          invoiceDate: '2024-03-15',
          supplierName: 'Supplier A',
          taxableValue: 1000,
          igst: 180,
          cgst: 0,
          sgst: 0,
          cess: 0,
          invoiceTotal: 1180
        }
      ];

      const engine = new ReconciliationEngine(books, gstr2b, defaultSettings);
      const result = engine.reconcile();

      expect(result.duplicates).toHaveLength(1);
    });
  });
});
