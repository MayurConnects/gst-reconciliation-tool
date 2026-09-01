# GST Reconciliation Tool

## 📊 Production-Grade Local-First Business Application

A powerful, privacy-respecting tool for matching business purchase records (Books) against GST return data (GSTR-2B).

**All data stays on your computer. No cloud. No tracking. No external APIs.**

---

## ✨ Features

### Core Reconciliation
- ✅ **GSTIN-wise Matching**: Compare supplier totals
- ✅ **Invoice-level Matching**: Match individual invoices
- ✅ **Fuzzy Matching**: Find similar invoices with confidence scores
- ✅ **Duplicate Detection**: Identify duplicate entries
- ✅ **Tax Reconciliation**: Compare IGST, CGST, SGST, Cess

### Data Import
- 📁 **Excel Support**: Upload .xlsx and .xls files
- 🔄 **Column Mapping**: Custom field mapping for various Excel formats
- 📋 **Data Validation**: Automatic format checking and error reporting
- 🚀 **Batch Processing**: Handle 50,000+ invoices

### Analysis & Reporting
- 📈 **Dashboard**: Real-time reconciliation metrics
- 📊 **Match Statistics**: Matched, mismatched, and missing invoices
- 🔍 **Detailed Results**: Invoice-by-invoice breakdown
- 📥 **Data Export**: Export results for further analysis

### Configuration
- ⚙️ **Flexible Tolerances**: Set tax and value tolerance thresholds
- 🎯 **Fuzzy Match Tuning**: Adjust confidence threshold
- 📅 **Date Tolerance**: Allow variations in invoice dates
- 💾 **Multiple Projects**: Manage concurrent reconciliations

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (included)
- Windows/Mac/Linux

### Installation

```bash
# Clone repository
git clone https://github.com/MayurConnects/gst-reconciliation-tool.git
cd gst-reconciliation-tool

# Install all dependencies
npm run install-all

# Setup database
npm run db:setup

# Start application
npm run dev
```

**Done!** 🎉
- Frontend: http://localhost:5173 (auto-opens)
- Backend: http://localhost:3001

**Total time: ~5 minutes**

---

## 📚 Documentation

### Getting Started
- **[Setup Guide](./docs/SETUP.md)** - Installation, configuration, troubleshooting
- **[API Documentation](./docs/API.md)** - REST API endpoints and responses
- **[Reconciliation Logic](./docs/RECONCILIATION_LOGIC.md)** - How the matching algorithm works

### Sample Data
- `sample-data/books_sample.xlsx` - Example purchase register format
- `sample-data/gstr2b_sample.xlsx` - Example GSTR-2B format

---

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for development and bundling
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js + Express** for REST API
- **Prisma ORM** for database abstraction
- **SQLite** for local data storage (PostgreSQL for production)
- **TypeScript** for type safety
- **Excel.js** for Excel file parsing

### Database
- **Prisma** with SQLite (dev) or PostgreSQL (prod)
- Schema with indexes for fast queries
- Migration support for schema updates

---

## 📁 Project Structure

```
gst-reconciliation-tool/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── app.ts             # Express setup
│   │   ├── index.ts           # Server entry
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helpers (parsing, normalization, etc.)
│   │   └── types/             # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # DB migrations
│   ├── tests/                 # Unit and integration tests
│   └── package.json
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── Reconciliation.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── sample-data/               # Example Excel files
│   ├── books_sample.xlsx
│   └── gstr2b_sample.xlsx
│
├── docs/                      # Documentation
│   ├── SETUP.md              # Setup and configuration
│   ├── API.md                # API reference
│   └── RECONCILIATION_LOGIC.md # Algorithm details
│
├── .env.example              # Environment variables template
├── .gitignore
├── package.json              # Root package.json
└── README.md                 # This file
```

---

## 🔧 Available Commands

### Development
```bash
# Start all (backend + frontend)
npm run dev

# Start backend only
cd backend && npm run dev

# Start frontend only
cd frontend && npm run dev

# Watch mode with auto-reload
npm run dev:watch
```

### Testing
```bash
# Run all tests
npm run test

# Run tests with watch mode
cd backend && npm run test:watch

# Run tests with coverage
cd backend && npm run test:coverage
```

### Database
```bash
# Setup database (create + migrate)
npm run db:setup

# Open Prisma Studio (GUI)
cd backend && npm run db:studio

# Create migration
cd backend && npm run db:migrate

# Reset database (warning: deletes all data)
cd backend && npm run db:reset
```

### Building
```bash
# Build all
npm run build

# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Start production server
cd backend && npm start
```

### Linting
```bash
# Lint backend
cd backend && npm run lint

# Lint frontend
cd frontend && npm run lint
```

---

## 💡 How It Works

### The Reconciliation Process

#### Step 1: Data Import
1. Upload purchase register (Books) Excel file
2. Upload GSTR-2B Excel file
3. System validates and normalizes data
4. Any errors recorded for review

#### Step 2: GSTIN-wise Reconciliation
1. Group invoices by supplier GSTIN
2. Calculate totals in both datasets
3. Compare with configured tolerance
4. Mark as MATCHED or MISMATCHED

#### Step 3: Invoice-level Matching
1. For each GSTIN, match invoices by number
2. Compare tax amounts (IGST, CGST, SGST, Cess)
3. Identify:
   - **Exact Matches**: All values match
   - **Partial Matches**: Some values differ
   - **Only in Books**: Invoice missing from GSTR-2B
   - **Only in 2B**: Invoice missing from Books

#### Step 4: Fuzzy Matching
1. For unmatched invoices, find similar ones
2. Calculate confidence score (0-100%)
3. Suggest possible matches if > threshold

#### Step 5: Duplicate Detection
1. Identify duplicate invoices
2. Flag for manual review
3. Prevent double-matching

#### Step 6: Report Generation
1. Summarize reconciliation results
2. List all matches and mismatches
3. Highlight issues requiring attention
4. Export for further analysis

---

## 🎯 Use Cases

### Monthly GST Reconciliation
Match monthly purchase register against GSTR-2B return.

**Typical workflow:**
1. Export Books from accounting software
2. Download GSTR-2B from GST portal
3. Upload both files
4. Review results
5. Resolve discrepancies

### Multi-Location Reconciliation
Reconcile purchases across multiple store locations (multiple GSTINs).

### Duplicate Invoice Investigation
Identify and resolve duplicate invoice entries.

### Tax Audit Preparation
Prepare detailed reconciliation report for auditors.

### Data Quality Check
Validate data before filing GST returns.

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# Backend
NODE_ENV=development      # development | production
PORT=3001                 # Backend port
DATABASE_URL=file:./gst_reconciliation.db  # SQLite (dev)

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
```

### Reconciliation Settings

Configurable via Settings page:

- **Tax Tolerance**: ₹1 (default) - Maximum rupee difference in tax
- **Invoice Value Tolerance**: ₹1 (default) - Maximum rupee difference in totals
- **Date Tolerance**: 0 days (default) - Allowed date variance
- **Fuzzy Match Threshold**: 90% (default) - Confidence for suggestions

---

## 📊 Performance

### Tested With
- Small files: 100-1,000 invoices (~1 second)
- Medium files: 1,000-10,000 invoices (~5 seconds)
- Large files: 10,000-50,000 invoices (~30 seconds)
- Very large: 50,000+ invoices (~120 seconds)

### Database Queries
- Indexed on GSTIN, Invoice Number, Upload ID
- Composite indexes for fast lookups
- Query optimization for large datasets

### Memory Usage
- Loads invoices into memory for fast processing
- Suitable for files < 50MB
- Batch processing for very large files

---

## 🔒 Security & Privacy

✅ **Local-first**: All data stays on your computer
✅ **No cloud**: No data ever sent to external servers
✅ **No tracking**: No telemetry or analytics
✅ **No APIs**: No external service dependencies
✅ **Open source**: Full code transparency
✅ **File encryption**: Optional database encryption
✅ **HTTPS support**: Use reverse proxy for production

---

## 🧪 Testing

### Test Coverage
- Data normalization
- GSTIN validation
- Invoice matching logic
- Fuzzy matching algorithm
- Duplicate detection
- Excel parsing
- API endpoints
- Error handling

### Running Tests

```bash
# Run all tests
cd backend && npm test

# Run specific test
cd backend && npm test -- normalization.test.ts

# Watch mode
cd backend && npm run test:watch

# Coverage report
cd backend && npm run test:coverage
```

---

## 📦 Dependencies

### Frontend
- react (18.2.0) - UI framework
- react-router-dom (6.8.0) - Routing
- axios (1.3.0) - HTTP client
- recharts (2.5.0) - Data visualization
- tailwindcss (3.2.4) - Styling
- ag-grid-react (31.0.0) - Data tables

### Backend
- express (4.18.0) - Web framework
- prisma (5.0.0) - ORM
- excel.js (17.0.0) - Excel parsing
- jest (29.0.0) - Testing
- typescript (5.0.0) - Language

---

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t gst-reconciliation .

# Run container
docker run -p 3001:3001 -p 5173:5173 gst-reconciliation
```

### Linux Server (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/MayurConnects/gst-reconciliation-tool.git
cd gst-reconciliation-tool
npm run install-all
npm run db:setup

# Build
npm run build

# Start (use process manager like PM2)
sudo npm install -g pm2
pm2 start "npm start" --name "gst-reconciliation"
pm2 save
pm2 startup
```

### Using Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api {
        proxy_pass http://localhost:3001/api;
    }
}
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit pull request

---

## 📄 License

MIT License - Feel free to use commercially

---

## 🆘 Support

### Having Issues?

1. Check [Setup Guide](./docs/SETUP.md) troubleshooting
2. Review [API Documentation](./docs/API.md)
3. Check browser console for errors (F12)
4. Review backend logs

### Getting Help

- 📖 Read documentation
- 🧪 Run tests
- 🐛 Report bugs
- 💡 Request features

---

## 🗺️ Roadmap

### v1.1 (Planned)
- [ ] Invoice splitting/merging
- [ ] Credit note handling
- [ ] Multi-period reconciliation
- [ ] Custom report templates
- [ ] Batch operations

### v1.2 (Future)
- [ ] GraphQL API
- [ ] Webhooks
- [ ] Advanced filtering & sorting
- [ ] Data export (PDF, CSV)
- [ ] Dark mode

### v2.0 (Vision)
- [ ] AI-powered matching suggestions
- [ ] Integration with accounting software
- [ ] Mobile app
- [ ] Advanced analytics

---

## 📞 Contact

**Created by**: Mayur Connects  
**GitHub**: [@MayurConnects](https://github.com/MayurConnects)  
**Repository**: [gst-reconciliation-tool](https://github.com/MayurConnects/gst-reconciliation-tool)

---

## 🎉 Get Started Now!

```bash
npm run dev
```

**Questions?** Check the [docs](./docs/) folder.

**Happy Reconciling!** 🎊

---

**Last Updated**: September 1, 2024  
**Version**: 1.0.0
