# GST Reconciliation Tool

A production-grade, local-first application for reconciling Indian business Books/Purchase Register data against GSTR-2B filings.

## Features

- **Local-First Architecture**: Works entirely on your Windows/Mac/Linux laptop without cloud dependency
- **Excel-Based Workflow**: Upload Books and GSTR-2B as Excel files
- **Multi-Stage Reconciliation**:
  - Stage 1: GSTIN-wise totals matching
  - Stage 2: Invoice-level reconciliation
  - Fuzzy matching for potential invoice variations
- **Comprehensive Discrepancy Detection**:
  - Exact matches
  - Partial matches (tax, value, date mismatches)
  - Missing invoices in either dataset
  - Duplicates
  - GSTIN mismatches
  - Data errors and validation issues
- **Professional Dashboard**: Real accounting application UI
- **Advanced Filtering & Searching**: By GSTIN, supplier, status, date, mismatch type
- **Excel Export**: Professional reports with formatting, charts, and summaries
- **Multiple Projects**: Maintain separate reconciliation runs for different periods
- **Configurable Tolerance**: Tax, value, and date tolerance settings
- **High Performance**: Handles 50,000+ invoices efficiently

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (fast build tool)
- TailwindCSS (styling)
- React Query (data fetching)
- React Router (navigation)
- Recharts (charts)
- AG Grid (advanced tables)
- Axios (HTTP client)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite (local database)
- ExcelJS (Excel file handling)
- Jest (testing)

## Project Structure

```
gst-reconciliation-tool/
├── backend/                 # Node.js + Express server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Helper functions
│   │   ├── types/          # TypeScript types
│   │   ├── reconciliation/ # Core reconciliation engine
│   │   └── app.ts          # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # DB migrations
│   ├── tests/              # Jest test suites
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── sample-data/            # Sample Excel files for testing
│   ├── books_sample.xlsx
│   └── gstr2b_sample.xlsx
│
├── docs/                   # Documentation
│   ├── API.md
│   ├── RECONCILIATION_LOGIC.md
│   └── SETUP.md
│
├── .gitignore
├── .env.example
├── package.json            # Root package.json for scripts
└── README.md
```

## Prerequisites

- Node.js 18+ and npm 9+
- Windows/Mac/Linux
- ~500MB free disk space

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MayurConnects/gst-reconciliation-tool.git
cd gst-reconciliation-tool
```

### 2. Install All Dependencies

```bash
npm run install-all
```

This installs dependencies for:
- Root project (for concurrently)
- Backend (Node.js + Express)
- Frontend (React + Vite)

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

### 4. Setup Database

```bash
npm run db:setup
```

This:
- Creates SQLite database (`backend/gst_reconciliation.db`)
- Runs Prisma migrations
- Seeds sample data (optional)

## Running the Application

### Development Mode (Both Frontend + Backend)

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

The frontend will open automatically in your browser.

### Frontend Only (if backend is running separately)

```bash
cd frontend && npm run dev
```

### Backend Only

```bash
cd backend && npm run dev
```

## Building for Production

### Build Both Frontend and Backend

```bash
npm run build
```

### Build Backend Only

```bash
npm run build:backend
```

### Build Frontend Only

```bash
npm run build:frontend
```

## Running Tests

```bash
npm run test
```

This runs the backend test suite, which includes comprehensive tests for:
- Data normalization
- GSTIN-wise reconciliation
- Invoice-level matching
- Duplicate detection
- Fuzzy matching
- Excel import/export
- Error handling

## Using the Application

### Step 1: Create a Reconciliation Project

1. Open the dashboard
2. Click "New Project"
3. Enter project name (e.g., "April 2026 Reconciliation")
4. Set tax period dates

### Step 2: Configure Column Mapping

1. Go to "Column Mapping" section
2. Upload your Books Excel file
3. Map columns from your file to standard fields
4. Save mapping (reused for future uploads)
5. Repeat for GSTR-2B file

### Step 3: Upload Data Files

1. Go to "Upload Data"
2. Upload Books Excel file
3. Upload GSTR-2B Excel file
4. Review data preview
5. Check validation report for any errors

### Step 4: Run Reconciliation

1. Go to "Reconciliation"
2. Click "Start Reconciliation"
3. Configure tolerance settings:
   - Tax Tolerance: Default ₹1
   - Value Tolerance: Default ₹1
   - Date Tolerance: Default 0 days
   - Fuzzy Match Threshold: Default 90%
4. Run reconciliation

### Step 5: Review Results

1. **Dashboard**: Overview of matched/mismatched/missing invoices
2. **Reconciliation Table**:
   - Search by invoice number, GSTIN, supplier
   - Filter by status, date range, mismatch type
   - View row details
   - Sort by any column
3. **Exceptions**: Review data errors and validation issues
4. **Duplicates**: Identify and manage duplicate invoices
5. **Possible Matches**: Review fuzzy matches with confidence scores

### Step 6: Export Results

1. Click "Export Report"
2. Choose format (Excel with multiple sheets)
3. Report includes:
   - Summary sheet with metrics
   - Exact matches
   - Mismatches (detailed breakdown)
   - Only in Books
   - Only in GSTR-2B
   - Duplicates
   - Possible matches
   - Data errors
   - Professional formatting with filters and conditional highlighting

## Sample Data

The application includes sample Excel files for testing:

```bash
# Books/Purchase Register Sample
sample-data/books_sample.xlsx

# GSTR-2B Sample
sample-data/gstr2b_sample.xlsx
```

You can use these to:
1. Test the application without real data
2. Understand the required Excel format
3. Verify reconciliation logic

## Configuration

### Settings (in-app)

Go to Settings to configure:
- **Tax Tolerance**: ₹ amount for tax difference tolerance
- **Invoice Value Tolerance**: ₹ amount for total difference tolerance
- **Date Tolerance**: Days difference allowed
- **Fuzzy Match Threshold**: Confidence % for possible matches (default 90%)
- **Invoice Normalization Rules**: How to handle special characters

All settings are stored locally and persist between sessions.

## Reconciliation Logic

### Stage 1: GSTIN-wise Total Matching

Groups all invoices by supplier GSTIN and compares totals:

```
For each GSTIN:
  Books Total = Sum(Taxable Value + IGST + CGST + SGST + Cess)
  GSTR-2B Total = Sum(Taxable Value + IGST + CGST + SGST + Cess)
  Difference = Books Total - GSTR-2B Total
  
  If |Difference| <= Tolerance:
    Status = MATCHED
  Else:
    Status = MISMATCHED
    → Move to Stage 2 for this GSTIN
```

### Stage 2: Invoice-level Reconciliation

For each invoice, tries to find a match using:

**Primary Key**: Normalized GSTIN + Normalized Invoice Number

**Matching Algorithm**:
1. Exact match (GSTIN + Invoice# identical)
2. Fuzzy match (high similarity, different minor details)
3. Value-based match (same GSTIN, close amount/date, invoice# variation)

**Value Comparison**:
- Taxable Value
- IGST, CGST, SGST, Cess
- Total Invoice Value

Each difference is marked as a separate mismatch type.

### Duplicate Detection

Primary key: Normalized(GSTIN + Invoice Number)

If multiple records exist with the same key:
- Marked as duplicates
- Isolated for review
- Can be manually merged or ignored

### Normalization Rules

**GSTIN Normalization**:
- Convert to uppercase
- Remove leading/trailing spaces
- Validate format (15 characters, alphanumeric)

**Invoice Number Normalization**:
- Convert to uppercase
- Remove leading/trailing spaces
- Replace multiple spaces with single space
- Intelligently handle "/" and "-" (preserve if meaningful)
- Remove only obvious formatting characters

**Date Handling**:
- Parse Excel serial numbers
- Parse string dates in multiple formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
- Convert all to ISO format (YYYY-MM-DD)

**Numeric Handling**:
- Remove commas
- Remove ₹ symbol
- Handle negative values
- Round to 2 decimals for currency

## API Endpoints

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Column Mapping
- `POST /api/column-mappings` - Save mapping
- `GET /api/column-mappings/:id` - Get mapping
- `GET /api/column-mappings/sample/:type` - Get sample columns

### File Upload
- `POST /api/uploads` - Upload Excel file
- `GET /api/uploads/:id` - Get upload details

### Reconciliation
- `POST /api/reconciliations/run` - Start reconciliation
- `GET /api/reconciliations/:id` - Get results
- `GET /api/reconciliations/:id/summary` - Get summary
- `GET /api/reconciliations/:id/matches` - Get matched invoices
- `GET /api/reconciliations/:id/mismatches` - Get mismatched invoices
- `GET /api/reconciliations/:id/duplicates` - Get duplicates
- `GET /api/reconciliations/:id/exceptions` - Get errors

### Export
- `GET /api/reconciliations/:id/export` - Export to Excel

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Reinstall dependencies
```bash
npm run install-all
```

### Issue: Database errors

**Solution**: Reset database
```bash
rm backend/gst_reconciliation.db*
npm run db:setup
```

### Issue: Port already in use

**Solution**: Change port in `.env`
```
PORT=3002
```

### Issue: Excel file not uploading

**Ensure**:
- File is `.xlsx` or `.xls` format
- File is not corrupted
- File has required columns
- File size < 50MB

### Issue: Reconciliation taking too long

**For large files** (50,000+ records):
- Reconciliation may take 30-60 seconds
- This is normal (non-optimized fuzzy matching)
- Progress indicator will show status

## Performance Characteristics

- **Small files** (< 1,000 invoices): < 1 second
- **Medium files** (1,000 - 10,000 invoices): 1-5 seconds
- **Large files** (10,000 - 50,000 invoices): 5-30 seconds
- **Very large files** (50,000+ invoices): 30-120 seconds

## Security Notes

✅ **What's Secure**:
- All data stays on your machine
- No internet required for core functionality
- No cloud storage or external API calls
- No tracking or telemetry
- Files processed in memory, not logged

⚠️ **Best Practices**:
- Keep backups of original Excel files
- Don't share the database file (contains sensitive data)
- Use strong password if sharing computer
- Keep Node.js and npm updated

## Development

### Adding a New Feature

1. **Backend**:
   - Create service in `backend/src/services/`
   - Add API route in `backend/src/routes/`
   - Write tests in `backend/tests/`
   - Update database schema if needed

2. **Frontend**:
   - Create component in `frontend/src/components/`
   - Create page in `frontend/src/pages/`
   - Call backend API in `frontend/src/services/api.ts`
   - Add types in `frontend/src/types/`

### Code Style

- TypeScript strict mode enabled
- ESLint configured
- Format code before committing

### Running Linter

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review sample data and documentation
3. Open an issue on GitHub

---

**Happy Reconciling! 📊**
