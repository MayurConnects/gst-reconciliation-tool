export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Upload {
  id: string;
  projectId: string;
  fileName: string;
  fileType: 'books' | 'gstr2b';
  mimeType: string;
  fileSize: number;
  columnMapping: Record<string, string>;
  uploadedAt: string;
}

export interface Invoice {
  id: string;
  gstin: string;
  supplierName?: string;
  invoiceNumber: string;
  invoiceDateString: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  invoiceTotal: number;
}

export interface ReconciliationSettings {
  taxTolerance: number;
  invoiceValueTolerance: number;
  dateTolerance: number;
  fuzzyMatchThreshold: number;
}

export interface ReconciliationResult {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  gstinMatches: Array<{
    id: string;
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
  }>;
  duplicates: any[];
}
