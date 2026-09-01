import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReconciliationEngine } from '../utils/reconciliationEngine';
import { ReconciliationSettings } from '../types';

const prisma = new PrismaClient();
const router = Router();

// Default reconciliation settings
const defaultSettings: ReconciliationSettings = {
  taxTolerance: 1,
  invoiceValueTolerance: 1,
  dateTolerance: 0,
  fuzzyMatchThreshold: 90
};

// Run reconciliation
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { projectId, booksUploadId, gstr2bUploadId, settings } = req.body;

    if (!projectId || !booksUploadId || !gstr2bUploadId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create reconciliation record
    const reconciliation = await prisma.reconciliation.create({
      data: {
        projectId,
        booksUploadId,
        gstr2bUploadId,
        status: 'RUNNING',
        settings: settings || defaultSettings
      }
    });

    try {
      // Fetch invoices from uploads
      const booksInvoices = await prisma.invoice.findMany({
        where: { uploadId: booksUploadId }
      });

      const gstr2bInvoices = await prisma.invoice.findMany({
        where: { uploadId: gstr2bUploadId }
      });

      if (booksInvoices.length === 0) {
        throw new Error('No invoices found in Books upload');
      }

      if (gstr2bInvoices.length === 0) {
        throw new Error('No invoices found in GSTR-2B upload');
      }

      // Convert to format expected by engine
      const booksData = booksInvoices.map(inv => ({
        gstin: inv.gstin,
        supplierName: inv.supplierName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDateString,
        taxableValue: inv.taxableValue,
        igst: inv.igst,
        cgst: inv.cgst,
        sgst: inv.sgst,
        cess: inv.cess,
        invoiceTotal: inv.invoiceTotal
      }));

      const gstr2bData = gstr2bInvoices.map(inv => ({
        gstin: inv.gstin,
        supplierName: inv.supplierName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDateString,
        taxableValue: inv.taxableValue,
        igst: inv.igst,
        cgst: inv.cgst,
        sgst: inv.sgst,
        cess: inv.cess,
        invoiceTotal: inv.invoiceTotal
      }));

      // Run reconciliation engine
      const engine = new ReconciliationEngine(
        booksData as any,
        gstr2bData as any,
        settings || defaultSettings
      );

      const result = engine.reconcile();

      // Store GSTIN summary results
      for (const gstin of result.gstinSummary) {
        const supplier = await prisma.supplier.findUnique({
          where: { gstin: gstin.gstin }
        });

        if (supplier) {
          await prisma.reconciliationGstin.create({
            data: {
              reconciliationId: reconciliation.id,
              supplierId: supplier.id,
              gstin: gstin.gstin,
              booksCount: gstin.booksCount,
              gstr2bCount: gstin.gstr2bCount,
              booksTaxableTotal: gstin.booksTaxableTotal,
              gstr2bTaxableTotal: gstin.gstr2bTaxableTotal,
              booksTaxTotal: gstin.booksTaxTotal,
              gstr2bTaxTotal: gstin.gstr2bTaxTotal,
              booksTotalInvoice: gstin.booksTotalInvoice,
              gstr2bTotalInvoice: gstin.gstr2bTotalInvoice,
              status: gstin.status
            }
          });
        }
      }

      // Store duplicate detection results
      for (const duplicate of result.duplicates) {
        if (duplicate.invoices.length > 1) {
          const inv1 = duplicate.invoices[0];
          const inv2 = duplicate.invoices[1];

          const inv1Record = await prisma.invoice.findFirst({
            where: {
              gstin: inv1.gstin,
              invoiceNumber: inv1.invoiceNumber,
              uploadFileType: duplicate.uploadType
            }
          });

          const inv2Record = await prisma.invoice.findFirst({
            where: {
              gstin: inv2.gstin,
              invoiceNumber: inv2.invoiceNumber,
              uploadFileType: duplicate.uploadType
            }
          });

          if (inv1Record && inv2Record) {
            await prisma.duplicateRecord.create({
              data: {
                reconciliationId: reconciliation.id,
                invoiceId1: inv1Record.id,
                invoiceId2: inv2Record.id,
                uploadType: duplicate.uploadType,
                reason: duplicate.reason
              }
            });
          }
        }
      }

      // Update reconciliation status
      const updatedReconciliation = await prisma.reconciliation.update({
        where: { id: reconciliation.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });

      res.json({
        id: updatedReconciliation.id,
        status: updatedReconciliation.status,
        summary: {
          totalBooksInvoices: booksInvoices.length,
          totalGstr2bInvoices: gstr2bInvoices.length,
          gstinMatches: result.gstinSummary.length,
          duplicates: result.duplicates.length,
          possibleMatches: result.possibleMatches.length
        }
      });
    } catch (error: any) {
      // Update reconciliation with error
      await prisma.reconciliation.update({
        where: { id: reconciliation.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      throw error;
    }
  } catch (error: any) {
    console.error('Error running reconciliation:', error);
    res.status(500).json({ error: error.message || 'Failed to run reconciliation' });
  }
});

// Get reconciliation results
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id },
      include: {
        gstinMatches: true,
        duplicates: true
      }
    });

    if (!reconciliation) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    res.json(reconciliation);
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliation' });
  }
});

// Get reconciliation summary
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id },
      include: {
        gstinMatches: { include: { supplier: true } },
        duplicates: true
      }
    });

    if (!reconciliation) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    const matched = reconciliation.gstinMatches.filter(m => m.status === 'MATCHED').length;
    const mismatched = reconciliation.gstinMatches.filter(m => m.status === 'MISMATCHED').length;
    const onlyBooks = reconciliation.gstinMatches.filter(m => m.status === 'ONLY_IN_BOOKS').length;
    const only2b = reconciliation.gstinMatches.filter(m => m.status === 'ONLY_IN_2B').length;

    res.json({
      id: reconciliation.id,
      status: reconciliation.status,
      createdAt: reconciliation.createdAt,
      completedAt: reconciliation.completedAt,
      summary: {
        totalGstins: reconciliation.gstinMatches.length,
        matched,
        mismatched,
        onlyInBooks: onlyBooks,
        onlyIn2b: only2b,
        duplicates: reconciliation.duplicates.length,
        matchPercentage: reconciliation.gstinMatches.length > 0
          ? Math.round((matched / reconciliation.gstinMatches.length) * 100)
          : 0
      },
      details: reconciliation.gstinMatches
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get duplicates
router.get('/:id/duplicates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const duplicates = await prisma.duplicateRecord.findMany({
      where: { reconciliationId: id },
      include: {
        invoice1: true,
        invoice2: true
      }
    });

    res.json(duplicates);
  } catch (error) {
    console.error('Error fetching duplicates:', error);
    res.status(500).json({ error: 'Failed to fetch duplicates' });
  }
});

export { router as reconciliationRoutes };
