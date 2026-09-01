import { NormalizedInvoice, ReconciliationSettings, GstinSummary, InvoiceMatch, ReconciliationResult } from '../types';

interface InvoiceMap {
  [key: string]: NormalizedInvoice[];
}

interface DuplicateInvoice {
  uploadType: 'books' | 'gstr2b';
  invoices: NormalizedInvoice[];
  reason: string;
}

export class ReconciliationEngine {
  private booksInvoices: NormalizedInvoice[];
  private gstr2bInvoices: NormalizedInvoice[];
  private settings: ReconciliationSettings;

  constructor(
    booksInvoices: NormalizedInvoice[],
    gstr2bInvoices: NormalizedInvoice[],
    settings: ReconciliationSettings
  ) {
    this.booksInvoices = booksInvoices;
    this.gstr2bInvoices = gstr2bInvoices;
    this.settings = settings;
  }

  /**
   * Create lookup key for invoice: GSTIN + Invoice Number
   */
  private createLookupKey(invoice: NormalizedInvoice): string {
    return `${invoice.gstin}|${invoice.invoiceNumber}`;
  }

  /**
   * Stage 1: GSTIN-wise reconciliation
   */
  private reconcileGstin(): GstinSummary[] {
    const gstinMap = new Map<string, GstinSummary>();

    // Group Books by GSTIN
    for (const invoice of this.booksInvoices) {
      if (!gstinMap.has(invoice.gstin)) {
        gstinMap.set(invoice.gstin, {
          gstin: invoice.gstin,
          supplierName: invoice.supplierName,
          booksCount: 0,
          gstr2bCount: 0,
          booksTaxableTotal: 0,
          gstr2bTaxableTotal: 0,
          booksTaxTotal: 0,
          gstr2bTaxTotal: 0,
          booksTotalInvoice: 0,
          gstr2bTotalInvoice: 0,
          status: 'MATCHED'
        });
      }

      const summary = gstinMap.get(invoice.gstin)!;
      summary.booksCount++;
      summary.booksTaxableTotal += invoice.taxableValue;
      summary.booksTaxTotal += invoice.igst + invoice.cgst + invoice.sgst + invoice.cess;
      summary.booksTotalInvoice += invoice.invoiceTotal;
    }

    // Add GSTR-2B data
    for (const invoice of this.gstr2bInvoices) {
      if (!gstinMap.has(invoice.gstin)) {
        gstinMap.set(invoice.gstin, {
          gstin: invoice.gstin,
          supplierName: invoice.supplierName,
          booksCount: 0,
          gstr2bCount: 0,
          booksTaxableTotal: 0,
          gstr2bTaxableTotal: 0,
          booksTaxTotal: 0,
          gstr2bTaxTotal: 0,
          booksTotalInvoice: 0,
          gstr2bTotalInvoice: 0,
          status: 'MATCHED'
        });
      }

      const summary = gstinMap.get(invoice.gstin)!;
      summary.gstr2bCount++;
      summary.gstr2bTaxableTotal += invoice.taxableValue;
      summary.gstr2bTaxTotal += invoice.igst + invoice.cgst + invoice.sgst + invoice.cess;
      summary.gstr2bTotalInvoice += invoice.invoiceTotal;
    }

    // Compare totals
    const results: GstinSummary[] = [];
    for (const summary of gstinMap.values()) {
      const taxDiff = Math.abs(summary.booksTaxTotal - summary.gstr2bTaxTotal);
      const valueDiff = Math.abs(summary.booksTotalInvoice - summary.gstr2bTotalInvoice);

      if (summary.booksCount === 0 && summary.gstr2bCount > 0) {
        summary.status = 'ONLY_IN_2B';
      } else if (summary.gstr2bCount === 0 && summary.booksCount > 0) {
        summary.status = 'ONLY_IN_BOOKS';
      } else if (taxDiff <= this.settings.taxTolerance && valueDiff <= this.settings.invoiceValueTolerance) {
        summary.status = 'MATCHED';
      } else {
        summary.status = 'MISMATCHED';
      }

      results.push(summary);
    }

    return results;
  }

  /**
   * Stage 2: Invoice-level reconciliation
   */
  private reconcileInvoices(): { matches: InvoiceMatch[]; possibleMatches: any[] } {
    const booksMap = new Map<string, NormalizedInvoice>();
    const gstr2bMap = new Map<string, NormalizedInvoice>();
    const matches: InvoiceMatch[] = [];
    const possibleMatches: any[] = [];

    // Build lookup maps
    for (const invoice of this.booksInvoices) {
      const key = this.createLookupKey(invoice);
      booksMap.set(key, invoice);
    }

    for (const invoice of this.gstr2bInvoices) {
      const key = this.createLookupKey(invoice);
      gstr2bMap.set(key, invoice);
    }

    // Find exact matches
    const matchedKeys = new Set<string>();
    for (const [booksKey, booksInvoice] of booksMap.entries()) {
      if (gstr2bMap.has(booksKey)) {
        const gstr2bInvoice = gstr2bMap.get(booksKey)!;
        const match = this.compareInvoices(booksInvoice, gstr2bInvoice);
        matches.push(match);
        matchedKeys.add(booksKey);
      }
    }

    // Find unmatched Books invoices
    for (const [booksKey, booksInvoice] of booksMap.entries()) {
      if (!matchedKeys.has(booksKey)) {
        matches.push({
          booksInvoice,
          matchType: 'ONLY_BOOKS',
          matchStatus: 'ONLY_IN_BOOKS',
          differences: {
            taxableValue: booksInvoice.taxableValue,
            igst: booksInvoice.igst,
            cgst: booksInvoice.cgst,
            sgst: booksInvoice.sgst,
            cess: booksInvoice.cess,
            totalValue: booksInvoice.invoiceTotal
          }
        });
      }
    }

    // Find unmatched GSTR-2B invoices
    for (const [gstr2bKey, gstr2bInvoice] of gstr2bMap.entries()) {
      if (!matchedKeys.has(gstr2bKey)) {
        matches.push({
          booksInvoice: gstr2bInvoice,
          matchType: 'ONLY_BOOKS', // Treat as only in 2B for display
          matchStatus: 'ONLY_IN_2B',
          differences: {
            taxableValue: gstr2bInvoice.taxableValue,
            igst: gstr2bInvoice.igst,
            cgst: gstr2bInvoice.cgst,
            sgst: gstr2bInvoice.sgst,
            cess: gstr2bInvoice.cess,
            totalValue: gstr2bInvoice.invoiceTotal
          }
        });
      }
    }

    // Fuzzy matching for potential matches
    for (const [booksKey, booksInvoice] of booksMap.entries()) {
      if (!matchedKeys.has(booksKey)) {
        for (const gstr2bInvoice of this.gstr2bInvoices) {
          if (booksInvoice.gstin === gstr2bInvoice.gstin) {
            const similarity = this.calculateSimilarity(booksInvoice, gstr2bInvoice);
            if (similarity >= this.settings.fuzzyMatchThreshold) {
              possibleMatches.push({
                booksInvoice,
                gstr2bInvoice,
                confidence: similarity,
                reason: `Similar invoice (${similarity.toFixed(1)}% match) - Invoice numbers differ`
              });
            }
          }
        }
      }
    }

    return { matches, possibleMatches };
  }

  /**
   * Compare two invoices
   */
  private compareInvoices(books: NormalizedInvoice, gstr2b: NormalizedInvoice): InvoiceMatch {
    const differences = {
      taxableValue: books.taxableValue - gstr2b.taxableValue,
      igst: books.igst - gstr2b.igst,
      cgst: books.cgst - gstr2b.cgst,
      sgst: books.sgst - gstr2b.sgst,
      cess: books.cess - gstr2b.cess,
      totalValue: books.invoiceTotal - gstr2b.invoiceTotal
    };

    const taxableMatch = Math.abs(differences.taxableValue) <= this.settings.invoiceValueTolerance;
    const igstMatch = Math.abs(differences.igst) <= this.settings.taxTolerance;
    const cgstMatch = Math.abs(differences.cgst) <= this.settings.taxTolerance;
    const sgstMatch = Math.abs(differences.sgst) <= this.settings.taxTolerance;
    const cessMatch = Math.abs(differences.cess) <= this.settings.taxTolerance;
    const totalMatch = Math.abs(differences.totalValue) <= this.settings.invoiceValueTolerance;

    let matchStatus = 'EXACT_MATCH';
    let matchType: 'EXACT' | 'PARTIAL' = 'EXACT';

    if (!taxableMatch && !totalMatch) {
      matchStatus = 'MULTIPLE_DIFFERENCES';
      matchType = 'PARTIAL';
    } else if (!taxableMatch) {
      matchStatus = 'TAXABLE_VALUE_MISMATCH';
      matchType = 'PARTIAL';
    } else if (!igstMatch) {
      matchStatus = 'IGST_MISMATCH';
      matchType = 'PARTIAL';
    } else if (!cgstMatch) {
      matchStatus = 'CGST_MISMATCH';
      matchType = 'PARTIAL';
    } else if (!sgstMatch) {
      matchStatus = 'SGST_MISMATCH';
      matchType = 'PARTIAL';
    } else if (!cessMatch) {
      matchStatus = 'CESS_MISMATCH';
      matchType = 'PARTIAL';
    } else if (!totalMatch) {
      matchStatus = 'TOTAL_VALUE_MISMATCH';
      matchType = 'PARTIAL';
    }

    return {
      booksInvoice: books,
      gstr2bInvoice: gstr2b,
      matchType,
      matchStatus,
      differences
    };
  }

  /**
   * Calculate similarity between two invoices (fuzzy matching)
   */
  private calculateSimilarity(invoice1: NormalizedInvoice, invoice2: NormalizedInvoice): number {
    let score = 0;
    let maxScore = 0;

    // GSTIN match (30%)
    if (invoice1.gstin === invoice2.gstin) {
      score += 30;
    }
    maxScore += 30;

    // Invoice number similarity (20%)
    const invNumSim = this.stringSimilarity(invoice1.invoiceNumber, invoice2.invoiceNumber);
    score += invNumSim * 20;
    maxScore += 20;

    // Date match (15%)
    if (invoice1.invoiceDate === invoice2.invoiceDate) {
      score += 15;
    } else {
      const dateDiff = Math.abs(
        new Date(invoice1.invoiceDate).getTime() - new Date(invoice2.invoiceDate).getTime()
      ) / (1000 * 60 * 60 * 24);
      if (dateDiff <= this.settings.dateTolerance) {
        score += 15;
      }
    }
    maxScore += 15;

    // Taxable value match (20%)
    if (Math.abs(invoice1.taxableValue - invoice2.taxableValue) <= this.settings.invoiceValueTolerance) {
      score += 20;
    }
    maxScore += 20;

    // Total value match (15%)
    if (Math.abs(invoice1.invoiceTotal - invoice2.invoiceTotal) <= this.settings.invoiceValueTolerance) {
      score += 15;
    }
    maxScore += 15;

    return (score / maxScore) * 100;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private stringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Detect duplicates within a dataset
   */
  private detectDuplicates(): { books: DuplicateInvoice[]; gstr2b: DuplicateInvoice[] } {
    const booksDuplicates = this.findDuplicatesInSet(this.booksInvoices, 'books');
    const gstr2bDuplicates = this.findDuplicatesInSet(this.gstr2bInvoices, 'gstr2b');

    return { books: booksDuplicates, gstr2b: gstr2bDuplicates };
  }

  /**
   * Find duplicates in a single dataset
   */
  private findDuplicatesInSet(
    invoices: NormalizedInvoice[],
    type: 'books' | 'gstr2b'
  ): DuplicateInvoice[] {
    const keyMap = new Map<string, NormalizedInvoice[]>();

    for (const invoice of invoices) {
      const key = this.createLookupKey(invoice);
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(invoice);
    }

    const duplicates: DuplicateInvoice[] = [];
    for (const [key, group] of keyMap.entries()) {
      if (group.length > 1) {
        duplicates.push({
          uploadType: type,
          invoices: group,
          reason: `${group.length} invoices with GSTIN ${group[0].gstin} and invoice number ${group[0].invoiceNumber}`
        });
      }
    }

    return duplicates;
  }

  /**
   * Run full reconciliation
   */
  public reconcile(): {
    gstinSummary: GstinSummary[];
    matches: InvoiceMatch[];
    possibleMatches: any[];
    duplicates: DuplicateInvoice[];
  } {
    const gstinSummary = this.reconcileGstin();
    const { matches, possibleMatches } = this.reconcileInvoices();
    const { books: booksDuplicates, gstr2b: gstr2bDuplicates } = this.detectDuplicates();
    const duplicates = [...booksDuplicates, ...gstr2bDuplicates];

    return { gstinSummary, matches, possibleMatches, duplicates };
  }
}
