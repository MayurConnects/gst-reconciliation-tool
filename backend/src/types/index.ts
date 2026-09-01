export interface ColumnMap {
  [key: string]: string; // Excel column -> Standard field
}

export interface NormalizedInvoice {
  gstin: string;
  supplierName?: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO format YYYY-MM-DD
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  invoiceTotal: number;
  rawData?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  invoice?: NormalizedInvoice;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  value?: any;
  errorType: string; // 'INVALID_FORMAT', 'MISSING_REQUIRED', etc.
  message: string;
}

export interface ReconciliationSettings {
  taxTolerance: number; // in rupees
  invoiceValueTolerance: number; // in rupees
  dateTolerance: number; // in days
  fuzzyMatchThreshold: number; // 0-100
}

export interface GstinSummary {
  gstin: string;
  supplierName?: string;
  booksCount: number;
  gstr2bCount: number;
  booksTaxableTotal: number;
  gstr2bTaxableTotal: number;
  booksTaxTotal: number;
  gstr2bTaxTotal: number;
  booksTotalInvoice: number;
  gstr2bTotalInvoice: number;
  status: 'MATCHED' | 'MISMATCHED' | 'ONLY_IN_BOOKS' | 'ONLY_IN_2B';
}

export interface InvoiceMatch {
  id?: string;
  booksInvoice: NormalizedInvoice;
  gstr2bInvoice?: NormalizedInvoice;
  matchType: 'EXACT' | 'PARTIAL' | 'ONLY_BOOKS' | 'ONLY_2B';
  matchStatus: string;
  differences: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalValue: number;
  };
  confidence?: number;
}

export interface ReconciliationResult {
  id: string;
  projectId: string;
  gstinSummary: GstinSummary[];
  matches: InvoiceMatch[];
  possibleMatches: {
    booksInvoice: NormalizedInvoice;
    gstr2bInvoice: NormalizedInvoice;
    confidence: number;
    reason: string;
  }[];
  duplicates: Array<{
    uploadType: 'books' | 'gstr2b' | 'both';
    invoices: NormalizedInvoice[];
    reason: string;
  }>;
  errors: ValidationError[];
  summary: {
    totalBooksInvoices: number;
    totalGstr2bInvoices: number;
    exactMatches: number;
    partialMatches: number;
    onlyInBooks: number;
    onlyIn2b: number;
    duplicates: number;
    matchPercentage: number;
  };
}
