import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ExcelParser } from '../utils/excelParser';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${Date.now()}.xlsx`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload file
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId, fileType, columnMapping } = req.body;

    if (!projectId || !fileType || fileType !== 'books' && fileType !== 'gstr2b') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing or invalid projectId or fileType' });
    }

    // Parse Excel file
    const parseResult = await ExcelParser.parseExcel(req.file.path);

    const columnMap = columnMapping ? JSON.parse(columnMapping) : {};

    // Validate and normalize invoices
    const { invoices, errors } = ExcelParser.validateAndNormalize(parseResult.rows, columnMap);

    // Create upload record
    const uploadRecord = await prisma.upload.create({
      data: {
        projectId,
        fileName: req.file.originalname,
        fileType,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        columnMapping: columnMap
      }
    });

    // Store invoices
    for (const invoice of invoices) {
      // Create or get supplier
      let supplier = await prisma.supplier.findUnique({
        where: { gstin: invoice.gstin }
      });

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            gstin: invoice.gstin,
            name: invoice.supplierName
          }
        });
      }

      // Create invoice record
      await prisma.invoice.create({
        data: {
          uploadId: uploadRecord.id,
          uploadFileType: fileType,
          supplierId: supplier.id,
          gstin: invoice.gstin,
          supplierName: invoice.supplierName,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDateString: invoice.invoiceDate,
          taxableValue: invoice.taxableValue,
          igst: invoice.igst,
          cgst: invoice.cgst,
          sgst: invoice.sgst,
          cess: invoice.cess,
          invoiceTotal: invoice.invoiceTotal
        }
      });
    }

    // Store validation errors
    for (const error of errors) {
      await prisma.validationError.create({
        data: {
          uploadId: uploadRecord.id,
          rowNumber: error.rowNumber,
          field: error.field,
          errorType: error.errorType,
          message: error.message
        }
      });
    }

    res.json({
      id: uploadRecord.id,
      fileName: uploadRecord.fileName,
      fileType: uploadRecord.fileType,
      invoiceCount: invoices.length,
      errorCount: errors.length,
      errors: errors.slice(0, 10) // Return first 10 errors
    });
  } catch (error: any) {
    // Clean up uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Get upload details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        invoices: true,
        errors: true
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json(upload);
  } catch (error) {
    console.error('Error fetching upload:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Get preview of uploaded data
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        invoices: { take: 20 },
        errors: { take: 20 }
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json(upload);
  } catch (error) {
    console.error('Error fetching preview:', error);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
});

export { router as uploadRoutes };
