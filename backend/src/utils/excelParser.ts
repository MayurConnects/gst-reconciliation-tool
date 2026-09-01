import ExcelJS from 'exceljs';
import fs from 'fs';
import { NormalizedInvoice, ValidationResult } from '../types';
import { Normalizer } from './normalization';

export interface ExcelParseResult {
  rows: Record<string, any>[];
  headers: string[];
  errors: { rowNumber: number; field: string; message: string }[];
}

export class ExcelParser {
  /**
   * Parse Excel file and extract data
   */
  static async parseExcel(filePath: string): Promise<ExcelParseResult> {
    const workbook = new ExcelJS.Workbook();
    
    try {
      await workbook.xlsx.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${(error as Error).message}`);
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const rows: Record<string, any>[] = [];
    const errors: { rowNumber: number; field: string; message: string }[] = [];
    const headers: string[] = [];

    const data = worksheet.getSheetValues() as any[][];
    
    if (data.length < 2) {
      throw new Error('Excel file must contain headers and at least one data row');
    }

    // Extract headers (first row)
    const headerRow = data[1];
    for (let i = 1; i < headerRow.length; i++) {
      const header = headerRow[i];
      if (header) {
        headers.push(header.toString().trim());
      }
    }

    if (headers.length === 0) {
      throw new Error('No headers found in Excel file');
    }

    // Extract data rows (starting from row 2)
    for (let rowIndex = 2; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const record: Record<string, any> = {};
      let hasData = false;

      for (let colIndex = 1; colIndex < Math.min(row.length, headers.length + 1); colIndex++) {
        const value = row[colIndex];
        if (value !== null && value !== undefined && value !== '') {
          record[headers[colIndex - 1]] = value;
          hasData = true;
        }
      }

      if (hasData) {
        rows.push(record);
      }
    }

    return { rows, headers, errors };
  }

  /**
   * Validate and normalize invoice rows
   */
  static validateAndNormalize(
    rows: Record<string, any>[],
    columnMap: Record<string, string>
  ): {
    invoices: NormalizedInvoice[];
    errors: { rowNumber: number; field: string; errorType: string; message: string }[];
  } {
    const invoices: NormalizedInvoice[] = [];
    const errors: { rowNumber: number; field: string; errorType: string; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const result = Normalizer.normalizeInvoice(rows[i], columnMap);

      if (result.isValid && result.invoice) {
        invoices.push(result.invoice);
      } else {
        for (const error of result.errors) {
          errors.push({
            rowNumber: i + 2, // +2 because of header row and 0-indexing
            field: error.field,
            errorType: error.errorType,
            message: error.message
          });
        }
      }
    }

    return { invoices, errors };
  }
}
