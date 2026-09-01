# GST Reconciliation Tool - API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

No authentication required for local-first usage.

## Content Type

All requests and responses use `application/json` unless noted.

---

## Projects

### Create Project

```http
POST /projects
Content-Type: application/json

{
  "name": "April 2024 Reconciliation",
  "description": "Monthly reconciliation for April 2024",
  "startDate": "2024-04-01",
  "endDate": "2024-04-30"
}
```

**Response (201)**:
```json
{
  "id": "cuid123",
  "name": "April 2024 Reconciliation",
  "description": "Monthly reconciliation for April 2024",
  "startDate": "2024-04-01T00:00:00.000Z",
  "endDate": "2024-04-30T00:00:00.000Z",
  "createdAt": "2024-04-01T10:00:00.000Z",
  "updatedAt": "2024-04-01T10:00:00.000Z"
}
```

### List Projects

```http
GET /projects
```

**Response (200)**:
```json
[
  {
    "id": "cuid123",
    "name": "April 2024 Reconciliation",
    "description": "Monthly reconciliation for April 2024",
    "startDate": "2024-04-01T00:00:00.000Z",
    "endDate": "2024-04-30T00:00:00.000Z",
    "createdAt": "2024-04-01T10:00:00.000Z",
    "updatedAt": "2024-04-01T10:00:00.000Z"
  }
]
```

### Get Project

```http
GET /projects/:id
```

**Response (200)**: Project object with includes

### Update Project

```http
PUT /projects/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Project

```http
DELETE /projects/:id
```

**Response (200)**: `{ "success": true }`

---

## File Uploads

### Upload Excel File

```http
POST /uploads
Content-Type: multipart/form-data

form-data:
  file: <binary Excel file>
  projectId: "cuid123"
  fileType: "books" | "gstr2b"
  columnMapping: {"Excel Column Name": "standard_field"} (optional)
```

**Response (200)**:
```json
{
  "id": "upload_id",
  "fileName": "books.xlsx",
  "fileType": "books",
  "invoiceCount": 150,
  "errorCount": 2,
  "errors": [
    {
      "rowNumber": 5,
      "field": "gstin",
      "errorType": "INVALID_FORMAT",
      "message": "GSTIN must be 15 alphanumeric characters"
    }
  ]
}
```

### Get Upload Details

```http
GET /uploads/:id
```

**Response**: Upload with invoices and errors

### Get Upload Preview

```http
GET /uploads/:id/preview
```

**Response**: First 20 invoices and 20 errors

---

## Reconciliation

### Run Reconciliation

```http
POST /reconciliations/run
Content-Type: application/json

{
  "projectId": "cuid123",
  "booksUploadId": "books_upload_id",
  "gstr2bUploadId": "gstr2b_upload_id",
  "settings": {
    "taxTolerance": 1,
    "invoiceValueTolerance": 1,
    "dateTolerance": 0,
    "fuzzyMatchThreshold": 90
  }
}
```

**Response (200)**:
```json
{
  "id": "reconciliation_id",
  "status": "COMPLETED",
  "summary": {
    "totalBooksInvoices": 150,
    "totalGstr2bInvoices": 148,
    "gstinMatches": 12,
    "duplicates": 1,
    "possibleMatches": 3
  }
}
```

### Get Reconciliation Results

```http
GET /reconciliations/:id
```

**Response**:
```json
{
  "id": "reconciliation_id",
  "status": "COMPLETED",
  "gstinMatches": [
    {
      "id": "gstin_match_id",
      "gstin": "27AAJCU9603R1Z5",
      "supplierName": "Supplier ABC",
      "booksCount": 10,
      "gstr2bCount": 10,
      "booksTaxableTotal": 100000,
      "gstr2bTaxableTotal": 100000,
      "booksTaxTotal": 18000,
      "gstr2bTaxTotal": 18000,
      "booksTotalInvoice": 118000,
      "gstr2bTotalInvoice": 118000,
      "status": "MATCHED"
    }
  ],
  "duplicates": []
}
```

### Get Reconciliation Summary

```http
GET /reconciliations/:id/summary
```

**Response**:
```json
{
  "id": "reconciliation_id",
  "status": "COMPLETED",
  "summary": {
    "totalGstins": 12,
    "matched": 10,
    "mismatched": 2,
    "onlyInBooks": 0,
    "onlyIn2b": 0,
    "duplicates": 1,
    "matchPercentage": 83
  },
  "details": [...]
}
```

### Get Duplicates

```http
GET /reconciliations/:id/duplicates
```

**Response**:
```json
[
  {
    "id": "dup_id",
    "reconciliationId": "reconciliation_id",
    "invoiceId1": "invoice_1",
    "invoiceId2": "invoice_2",
    "uploadType": "books",
    "reason": "2 invoices with GSTIN 27AAJCU9603R1Z5 and invoice number INV001",
    "invoice1": {...},
    "invoice2": {...}
  }
]
```

---

## Settings

### Get Settings

```http
GET /settings
```

**Response (200)**:
```json
{
  "taxTolerance": 1,
  "invoiceValueTolerance": 1,
  "dateTolerance": 0,
  "fuzzyMatchThreshold": 90
}
```

### Update Settings

```http
PUT /settings
Content-Type: application/json

{
  "taxTolerance": 2,
  "invoiceValueTolerance": 5,
  "dateTolerance": 1,
  "fuzzyMatchThreshold": 85
}
```

**Response (200)**: Updated settings object

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing required fields: name, startDate, endDate"
}
```

### 404 Not Found

```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create project",
  "message": "Detailed error message in development mode"
}
```

---

## Data Types

### ReconciliationSettings

```typescript
{
  taxTolerance: number;           // ₹ for tax differences
  invoiceValueTolerance: number;  // ₹ for invoice total differences
  dateTolerance: number;          // Days for date differences
  fuzzyMatchThreshold: number;    // 0-100, percentage
}
```

### Invoice

```typescript
{
  id: string;
  gstin: string;                  // 15-char GST number
  supplierName?: string;
  invoiceNumber: string;          // Normalized
  invoiceDateString: string;      // ISO format YYYY-MM-DD
  taxableValue: number;           // In rupees
  igst: number;                   // Integrated GST
  cgst: number;                   // Central GST
  sgst: number;                   // State GST
  cess: number;                   // Cess
  invoiceTotal: number;           // Sum of all
}
```

---

## Rate Limiting

No rate limiting for local usage.

For production, implement:
- IP-based rate limiting
- Per-user rate limiting
- Endpoint-specific limits

---

## Pagination

Not implemented in v1.0. All results returned.

For large datasets, add:
```http
GET /reconciliations/:id/matches?page=1&limit=50
```

---

## Sorting & Filtering

Implement in frontend using fetched data.

Backend enhancement in future versions:
```http
GET /reconciliations/:id/matches?sort=invoiceTotal:desc&filter=status:MISMATCHED
```

---

## File Upload Constraints

- **Max size**: 50MB
- **Allowed formats**: .xlsx, .xls
- **Encoding**: UTF-8 recommended
- **Max rows**: 100,000 (tested with 50,000)

---

## Performance

- Reconciliation processing: See docs/SETUP.md
- Database queries: Indexed on GSTIN, Invoice Number, Upload ID
- In-memory matching: O(n log n) for fuzzy matching

---

## Webhooks

Not supported in v1.0.

Future: Webhook notifications for reconciliation completion.

---

## GraphQL

Not implemented. Using REST API.

---

## Testing Endpoints

### Health Check

```bash
curl http://localhost:3001/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-04-01T10:00:00.000Z"
}
```

### Create Sample Project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "startDate": "2024-04-01",
    "endDate": "2024-04-30"
  }'
```

---

## Changelog

### v1.0.0 (Current)
- Initial release
- GSTIN-wise reconciliation
- Invoice-level matching
- Fuzzy matching
- Duplicate detection
- Excel import/export
- Local-first architecture

---

**API Version**: 1.0.0
**Last Updated**: 2024-04-01
