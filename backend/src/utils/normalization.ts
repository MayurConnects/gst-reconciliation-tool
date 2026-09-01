import { NormalizedInvoice, ValidationResult, ValidationError } from '../types';

export class Normalizer {
  /**
   * Normalize GSTIN: uppercase, trim spaces, validate format
   */
  static normalizeGstin(gstin: string): { value: string; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    if (!gstin) {
      errors.push({
        field: 'gstin',
        errorType: 'MISSING_REQUIRED',
        message: 'GSTIN is required'
      });
      return { value: '', errors };
    }

    const normalized = gstin.toString().toUpperCase().trim();

    // GSTIN should be 15 characters
    if (!/^[A-Z0-9]{15}$/.test(normalized)) {
      errors.push({
        field: 'gstin',
        value: gstin,
        errorType: 'INVALID_FORMAT',
        message: `GSTIN must be 15 alphanumeric characters, got: ${normalized}`
      });
    }

    return { value: normalized, errors };
  }

  /**
   * Normalize invoice number: uppercase, trim, handle special chars
   */
  static normalizeInvoiceNumber(invoiceNumber: string): { value: string; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!invoiceNumber) {
      errors.push({
        field: 'invoiceNumber',
        errorType: 'MISSING_REQUIRED',
        message: 'Invoice number is required'
      });
      return { value: '', errors };
    }

    let normalized = invoiceNumber.toString().toUpperCase().trim();

    // Remove leading/trailing spaces
    normalized = normalized.replace(/^\s+|\s+$/g, '');

    // Replace multiple spaces with single space
    normalized = normalized.replace(/\s+/g, ' ');

    // Don't blindly remove all special chars - some may be meaningful
    // Only normalize obvious formatting
    normalized = normalized.replace(/[()\[\]{}]/g, '');

    if (!normalized) {
      errors.push({
        field: 'invoiceNumber',
        value: invoiceNumber,
        errorType: 'INVALID_FORMAT',
        message: 'Invoice number cannot be empty after normalization'
      });
    }

    return { value: normalized, errors };
  }

  /**
   * Parse date from various formats
   */
  static parseDate(dateValue: any): { value: string; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!dateValue) {
      errors.push({
        field: 'invoiceDate',
        errorType: 'MISSING_REQUIRED',
        message: 'Invoice date is required'
      });
      return { value: '', errors };
    }

    let date: Date | null = null;

    // If it's a number (Excel serial date)
    if (typeof dateValue === 'number') {
      // Excel dates start from Jan 1, 1900
      const excelEpoch = new Date(1900, 0, 1);
      date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
    }
    // If it's a string, try parsing
    else if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      // Try DD/MM/YYYY
      let match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      
      // Try DD-MM-YYYY
      if (!date) {
        match = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (match) {
          const [, day, month, year] = match;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // Try YYYY-MM-DD
      if (!date) {
        match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match) {
          const [, year, month, day] = match;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // Try ISO format
      if (!date) {
        const isoDate = new Date(trimmed);
        if (!isNaN(isoDate.getTime())) {
          date = isoDate;
        }
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    }

    if (!date || isNaN(date.getTime())) {
      errors.push({
        field: 'invoiceDate',
        value: dateValue,
        errorType: 'INVALID_FORMAT',
        message: `Could not parse date: ${dateValue}. Expected DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD`
      });
      return { value: '', errors };
    }

    // Return ISO format YYYY-MM-DD
    const isoDate = date.toISOString().split('T')[0];
    return { value: isoDate, errors };
  }

  /**
   * Parse numeric value: handle commas, ₹ symbol, negative values
   */
  static parseNumeric(value: any, field: string): { value: number; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (value === null || value === undefined || value === '') {
      return { value: 0, errors };
    }

    let numValue = 0;

    if (typeof value === 'number') {
      numValue = value;
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Remove ₹ symbol
      let cleaned = trimmed.replace(/[₹]/g, '');
      
      // Remove commas (Indian format)
      cleaned = cleaned.replace(/,/g, '');
      
      // Parse as float
      numValue = parseFloat(cleaned);
    }

    if (isNaN(numValue)) {
      errors.push({
        field,
        value,
        errorType: 'INVALID_FORMAT',
        message: `Invalid numeric value: ${value}`
      });
      return { value: 0, errors };
    }

    // Round to 2 decimal places
    numValue = Math.round(numValue * 100) / 100;

    return { value: numValue, errors };
  }

  /**
   * Normalize a complete invoice record
   */
  static normalizeInvoice(
    rawData: Record<string, any>,
    columnMap: Record<string, string>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const invoice: NormalizedInvoice = {
      gstin: '',
      invoiceNumber: '',
      invoiceDate: '',
      taxableValue: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      cess: 0,
      invoiceTotal: 0
    };

    // Map fields
    const mappedData: Record<string, any> = {};
    for (const [excelCol, standardField] of Object.entries(columnMap)) {
      if (rawData[excelCol] !== undefined) {
        mappedData[standardField] = rawData[excelCol];
      }
    }

    // Normalize GSTIN
    const gstinResult = this.normalizeGstin(mappedData['gstin'] || '');
    if (gstinResult.errors.length > 0) {
      errors.push(...gstinResult.errors);
    }
    invoice.gstin = gstinResult.value;

    // Normalize Invoice Number
    const invNumResult = this.normalizeInvoiceNumber(mappedData['invoiceNumber'] || '');
    if (invNumResult.errors.length > 0) {
      errors.push(...invNumResult.errors);
    }
    invoice.invoiceNumber = invNumResult.value;

    // Parse Invoice Date
    const dateResult = this.parseDate(mappedData['invoiceDate']);
    if (dateResult.errors.length > 0) {
      errors.push(...dateResult.errors);
    }
    invoice.invoiceDate = dateResult.value;

    // Parse numeric fields
    const fields = ['taxableValue', 'igst', 'cgst', 'sgst', 'cess', 'invoiceTotal'];
    for (const field of fields) {
      const numResult = this.parseNumeric(mappedData[field] || 0, field);
      if (numResult.errors.length > 0) {
        errors.push(...numResult.errors);
      }
      invoice[field as keyof Omit<NormalizedInvoice, 'gstin' | 'invoiceNumber' | 'invoiceDate' | 'supplierName' | 'rawData'>] = numResult.value;
    }

    // Optional supplier name
    invoice.supplierName = mappedData['supplierName'] || '';
    invoice.rawData = rawData;

    return {
      isValid: errors.length === 0,
      invoice,
      errors
    };
  }
}
