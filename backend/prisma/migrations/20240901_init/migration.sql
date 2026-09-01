-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "columnMapping" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gstin" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "uploadFileType" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "supplierName" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDateString" TEXT NOT NULL,
    "taxableValue" REAL NOT NULL,
    "igst" REAL NOT NULL,
    "cgst" REAL NOT NULL,
    "sgst" REAL NOT NULL,
    "cess" REAL NOT NULL,
    "invoiceTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE,
    CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT
);

-- CreateTable
CREATE TABLE "ValidationError" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationError_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mapping" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ColumnMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "booksUploadId" TEXT NOT NULL,
    "gstr2bUploadId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "settings" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reconciliation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "ReconciliationGstin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconciliationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "booksCount" INTEGER NOT NULL,
    "gstr2bCount" INTEGER NOT NULL,
    "booksTaxableTotal" REAL NOT NULL,
    "gstr2bTaxableTotal" REAL NOT NULL,
    "booksTaxTotal" REAL NOT NULL,
    "gstr2bTaxTotal" REAL NOT NULL,
    "booksTotalInvoice" REAL NOT NULL,
    "gstr2bTotalInvoice" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "toleranceExceeded" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReconciliationGstin_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation" ("id") ON DELETE CASCADE,
    CONSTRAINT "ReconciliationGstin_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconciliationId" TEXT NOT NULL,
    "booksInvoiceId" TEXT NOT NULL,
    "gstr2bInvoiceId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "taxableValueMatch" BOOLEAN NOT NULL,
    "igstMatch" BOOLEAN NOT NULL,
    "cgstMatch" BOOLEAN NOT NULL,
    "sgstMatch" BOOLEAN NOT NULL,
    "cessMatch" BOOLEAN NOT NULL,
    "totalValueMatch" BOOLEAN NOT NULL,
    "dateMatch" BOOLEAN NOT NULL,
    "taxableValueDiff" REAL NOT NULL,
    "igstDiff" REAL NOT NULL,
    "cgstDiff" REAL NOT NULL,
    "sgstDiff" REAL NOT NULL,
    "cessDiff" REAL NOT NULL,
    "totalValueDiff" REAL NOT NULL,
    "matchStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation" ("id") ON DELETE CASCADE,
    CONSTRAINT "Match_booksInvoiceId_fkey" FOREIGN KEY ("booksInvoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT,
    CONSTRAINT "Match_gstr2bInvoiceId_fkey" FOREIGN KEY ("gstr2bInvoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT
);

-- CreateTable
CREATE TABLE "PossibleMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconciliationId" TEXT NOT NULL,
    "booksInvoiceId" TEXT NOT NULL,
    "gstr2bInvoiceId" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT 0,
    "accepted" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PossibleMatch_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "DuplicateRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconciliationId" TEXT NOT NULL,
    "invoiceId1" TEXT NOT NULL,
    "invoiceId2" TEXT NOT NULL,
    "uploadType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DuplicateRecord_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation" ("id") ON DELETE CASCADE,
    CONSTRAINT "DuplicateRecord_invoiceId1_fkey" FOREIGN KEY ("invoiceId1") REFERENCES "Invoice" ("id") ON DELETE RESTRICT,
    CONSTRAINT "DuplicateRecord_invoiceId2_fkey" FOREIGN KEY ("invoiceId2") REFERENCES "Invoice" ("id") ON DELETE RESTRICT
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Upload_projectId_idx" on "Upload"("projectId");

-- CreateIndex
CREATE INDEX "Upload_fileType_idx" on "Upload"("fileType");

-- CreateIndex
CREATE INDEX "Supplier_gstin_idx" on "Supplier"("gstin");

-- CreateIndex
CREATE INDEX "Invoice_uploadId_idx" on "Invoice"("uploadId");

-- CreateIndex
CREATE INDEX "Invoice_gstin_idx" on "Invoice"("gstin");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" on "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_uploadFileType_idx" on "Invoice"("uploadFileType");

-- CreateIndex
CREATE INDEX "ValidationError_uploadId_idx" on "ValidationError"("uploadId");

-- CreateIndex
CREATE INDEX "ValidationError_errorType_idx" on "ValidationError"("errorType");

-- CreateIndex
CREATE INDEX "ColumnMapping_projectId_idx" on "ColumnMapping"("projectId");

-- CreateIndex
CREATE INDEX "Reconciliation_projectId_idx" on "Reconciliation"("projectId");

-- CreateIndex
CREATE INDEX "Reconciliation_status_idx" on "Reconciliation"("status");

-- CreateIndex
CREATE INDEX "ReconciliationGstin_reconciliationId_idx" on "ReconciliationGstin"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationGstin_status_idx" on "ReconciliationGstin"("status");

-- CreateIndex
CREATE INDEX "ReconciliationGstin_gstin_idx" on "ReconciliationGstin"("gstin");

-- CreateIndex
CREATE INDEX "Match_reconciliationId_idx" on "Match"("reconciliationId");

-- CreateIndex
CREATE INDEX "Match_matchType_idx" on "Match"("matchType");

-- CreateIndex
CREATE INDEX "PossibleMatch_reconciliationId_idx" on "PossibleMatch"("reconciliationId");

-- CreateIndex
CREATE INDEX "PossibleMatch_confidence_idx" on "PossibleMatch"("confidence");

-- CreateIndex
CREATE INDEX "DuplicateRecord_reconciliationId_idx" on "DuplicateRecord"("reconciliationId");

-- CreateIndex
CREATE INDEX "DuplicateRecord_uploadType_idx" on "DuplicateRecord"("uploadType");

-- CreateIndex
CREATE INDEX "Settings_key_idx" on "Settings"("key");
