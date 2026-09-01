# GST Reconciliation Tool - Setup Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (included with Node.js)
- Windows/Mac/Linux
- ~500MB disk space

### Step 1: Clone Repository

```bash
git clone https://github.com/MayurConnects/gst-reconciliation-tool.git
cd gst-reconciliation-tool
```

### Step 2: Install Dependencies

```bash
npm run install-all
```

This installs:
- Root project dependencies (concurrently)
- Backend (Node.js + Express + Prisma)
- Frontend (React + Vite)

**Time: ~2-3 minutes depending on internet speed**

### Step 3: Setup Database

```bash
npm run db:setup
```

This:
- Generates Prisma Client
- Creates SQLite database
- Runs migrations
- Creates tables

### Step 4: Start Application

```bash
npm run dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173 (opens automatically)

**Total setup time: ~5 minutes**

---

## Detailed Setup

### Backend Setup Only

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

Backend runs on http://localhost:3001

API health check: http://localhost:3001/health

### Frontend Setup Only

Make sure backend is running first:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Separate Terminals

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

---

## Database Management

### Create/Reset Database

```bash
# Delete existing database
rm backend/gst_reconciliation.db*

# Recreate
npm run db:setup
```

### View Database (GUI)

```bash
cd backend
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

### Apply Migrations

```bash
cd backend
npm run db:migrate
```

---

## Environment Configuration

Create `.env` file in root:

```env
# Backend
NODE_ENV=development
PORT=3001
DATABASE_URL=file:./gst_reconciliation.db

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
```

**Note**: For production, use a proper database URL (PostgreSQL, MySQL, etc.) and set `NODE_ENV=production`.

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Run with Watch Mode

```bash
cd backend
npm run test:watch
```

**Tests cover**:
- Data normalization
- GSTIN reconciliation
- Invoice matching
- Fuzzy matching
- Duplicate detection
- Error handling

---

## Building for Production

### Build All

```bash
npm run build
```

### Build Backend Only

```bash
cd backend
npm run build
```

Output: `backend/dist/`

### Build Frontend Only

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`

### Start Production Server

```bash
cd backend
npm start
```

Serves on http://localhost:3001

---

## Project Structure

```
gst-reconciliation-tool/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app setup
│   │   ├── index.ts               # Server entry
│   │   ├── middleware/
│   │   │   └── errorHandler.ts    # Error middleware
│   │   ├── routes/
│   │   │   ├── projects.ts        # Project endpoints
│   │   │   ├── uploads.ts         # File upload endpoints
│   │   │   ├── reconciliations.ts # Reconciliation endpoints
│   │   │   └── settings.ts        # Settings endpoints
│   │   ├── services/              # Business logic
│   │   ├── utils/
│   │   │   ├── normalization.ts   # Data normalization
│   │   │   ├── excelParser.ts     # Excel parsing
│   │   │   └── reconciliationEngine.ts # Core reconciliation logic
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # DB migrations
│   ├── tests/                     # Test files
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── Projects.tsx       # Projects list
│   │   │   ├── Upload.tsx         # File upload
│   │   │   ├── Reconciliation.tsx # Results viewer
│   │   │   └── Settings.tsx       # Configuration
│   │   ├── components/            # Reusable components
│   │   ├── services/
│   │   │   └── api.ts             # API client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   ├── App.tsx                # Root component
│   │   └── main.tsx               # Entry point
│   ├── public/                    # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── sample-data/
│   ├── books_sample.xlsx          # Sample Books file
│   └── gstr2b_sample.xlsx         # Sample GSTR-2B file
│
├── docs/
│   ├── API.md                     # API documentation
│   ├── RECONCILIATION_LOGIC.md    # Reconciliation algorithm
│   └── SETUP.md                   # This file
│
├── .env.example
├── .gitignore
├── package.json                   # Root package.json
└── README.md
```

---

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**:
```bash
npm run install-all
```

### Issue: Database errors

**Solution**:
```bash
rm backend/gst_reconciliation.db*
npm run db:setup
```

### Issue: Port 3001 already in use

**Solution**: Change port in `.env`:
```
PORT=3002
```

Then restart backend.

### Issue: Port 5173 already in use

**Solution**: Vite will automatically use the next available port (5174, 5175, etc.)

### Issue: CORS errors in browser console

**Solution**: Ensure backend is running and accessible at http://localhost:3001

### Issue: Excel upload fails

**Ensure**:
- File is `.xlsx` or `.xls` format
- File is not corrupted
- File size < 50MB
- File has required columns (GSTIN, Invoice Number, etc.)

### Issue: Slow reconciliation for large files

**This is normal**. Performance:
- Small files (< 1,000): < 1 second
- Medium files (1,000-10,000): 1-5 seconds
- Large files (10,000-50,000): 5-30 seconds
- Very large files (50,000+): 30-120 seconds

---

## Development

### Add New Feature

1. **Backend**:
   - Add service in `backend/src/services/`
   - Add route in `backend/src/routes/`
   - Update `schema.prisma` if needed
   - Run migration: `npm run db:migrate`
   - Write tests in `backend/tests/`

2. **Frontend**:
   - Add component in `frontend/src/components/`
   - Add page in `frontend/src/pages/`
   - Call API in `frontend/src/services/api.ts`
   - Add types in `frontend/src/types/`

### Code Style

- TypeScript strict mode enabled
- ESLint configured
- Format before commit

### Running Linter

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

---

## Docker (Optional)

### Build Docker Image

```bash
docker build -t gst-reconciliation .
```

### Run Container

```bash
docker run -p 3001:3001 -p 5173:5173 gst-reconciliation
```

---

## Performance Tips

### For Large Excel Files

1. **Split files**: Process smaller batches separately
2. **Increase tolerance**: Reduces fuzzy matching iterations
3. **Disable fuzzy matching**: If not needed, reduces processing time

### Database Optimization

```bash
cd backend
npm run db:studio  # View and analyze query performance
```

---

## Security Checklist

✅ All data stays local
✅ No cloud storage required
✅ No external API calls
✅ No telemetry/tracking
✅ Files processed in memory
✅ Database encryption (optional)
✅ HTTPS for production (use reverse proxy)

---

## Support

### Check Logs

Backend logs print to console during development.

Frontend logs in browser DevTools (F12 → Console).

### Database Issues

Use Prisma Studio:
```bash
cd backend
npm run db:studio
```

### API Issues

Test endpoints with curl:
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/projects
```

---

## Next Steps

1. ✅ Setup completed
2. 📚 Read [API.md](./API.md) for endpoint documentation
3. 🔧 Read [RECONCILIATION_LOGIC.md](./RECONCILIATION_LOGIC.md) for algorithm details
4. 📊 Try with sample data in `sample-data/`
5. 🧪 Run tests: `npm run test`
6. 🚀 Deploy to production

---

**Happy Reconciling! 🎉**
