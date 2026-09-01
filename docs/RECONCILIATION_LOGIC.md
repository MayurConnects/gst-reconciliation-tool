# GST Reconciliation Logic

## Overview

The reconciliation process is divided into two stages:

1. **Stage 1: GSTIN-wise Reconciliation** - Compare totals by supplier
2. **Stage 2: Invoice-level Reconciliation** - Match individual invoices

---

## Stage 1: GSTIN-wise Reconciliation

### Purpose

Identify if a supplier's total amounts match between Books and GSTR-2B.

### Algorithm

```
For each unique GSTIN in Books and GSTR-2B:
  1. Group all invoices by GSTIN
  2. Calculate totals:
     Books Total = Sum(Taxable Value + IGST + CGST + SGST + Cess)
     GSTR-2B Total = Sum(Taxable Value + IGST + CGST + SGST + Cess)
  3. Compare with tolerance:
     Difference = |Books Total - GSTR-2B Total|
     If Difference <= Tolerance:
       Status = MATCHED
     Else:
       Status = MISMATCHED
       → Proceed to Stage 2 for this GSTIN
```

### Example

**Books Data:**
- GSTIN: 27AAJCU9603R1Z5
- Invoice 1: ₹100,000 taxable + ₹18,000 GST = ₹118,000
- Invoice 2: ₹50,000 taxable + ₹9,000 GST = ₹59,000
- **Total: ₹177,000**

**GSTR-2B Data:**
- GSTIN: 27AAJCU9603R1Z5
- Invoice 1: ₹100,000 taxable + ₹18,000 GST = ₹118,000
- Invoice 2: ₹50,000 taxable + ₹9,001 GST = ₹59,001
- **Total: ₹177,001**

**Comparison:**
- Difference = ₹177,001 - ₹177,000 = ₹1
- Tolerance = ₹1 (default)
- **Status: MATCHED** ✓

If the difference was ₹5, it would be MISMATCHED and proceed to Stage 2.

---

## Stage 2: Invoice-level Reconciliation

### Purpose

Identify which specific invoices match or have discrepancies.

### Matching Algorithm

#### Step 1: Create Lookup Key

Primary key for matching:
```
Lookup Key = GSTIN + Invoice Number (both normalized)
```

**Normalization**:
- GSTIN: Uppercase, trim spaces, validate 15 chars
- Invoice Number: Uppercase, trim spaces, remove brackets

Example:
- Raw: `27aajcu9603r1z5` + `inv-001` → `27AAJCU9603R1Z5` + `INV-001`

#### Step 2: Exact Match

```
For each Books invoice:
  1. Create normalized lookup key
  2. Search for exact match in GSTR-2B
  3. If found:
     - Compare values
     - Mark as EXACT or PARTIAL match
     - Record differences
```

#### Step 3: Value Comparison

For matched invoices, compare:
- Taxable Value
- IGST
- CGST
- SGST
- Cess
- Total Invoice Value
- Invoice Date (optional)

**Match Status Determination**:
```
if all values match exactly:
  Status = EXACT_MATCH
else if taxable value differs:
  Status = TAXABLE_VALUE_MISMATCH
else if IGST differs:
  Status = IGST_MISMATCH
else if CGST differs:
  Status = CGST_MISMATCH
else if SGST differs:
  Status = SGST_MISMATCH
else if Cess differs:
  Status = CESS_MISMATCH
else if total differs:
  Status = TOTAL_VALUE_MISMATCH
else if multiple values differ:
  Status = MULTIPLE_DIFFERENCES
```

### Example

**Books Invoice:**
```
GSTIN: 27AAJCU9603R1Z5
Invoice Number: INV-001
Taxable: ₹1,000
IGST: ₹180
CGST: ₹0
SGST: ₹0
Cess: ₹0
Total: ₹1,180
```

**GSTR-2B Invoice:**
```
GSTIN: 27AAJCU9603R1Z5
Invoice Number: INV-001
Taxable: ₹1,000
IGST: ₹185 (differs by ₹5)
CGST: ₹0
SGST: ₹0
Cess: ₹0
Total: ₹1,185
```

**Comparison Result:**
- Status: PARTIAL MATCH
- Match Status: IGST_MISMATCH
- Difference: ₹5 (exceeds tolerance of ₹1)
- Action: Flag for review

---

## Unmatched Invoices

### Only in Books

```
For each Books invoice:
  If no matching GSTR-2B invoice found:
    Status = ONLY_IN_BOOKS
    Action = Flag for investigation
```

### Only in GSTR-2B

```
For each GSTR-2B invoice:
  If no matching Books invoice found:
    Status = ONLY_IN_2B
    Action = Flag for investigation
```

---

## Duplicate Detection

### Algorithm

```
For each dataset (Books and GSTR-2B):
  1. Create lookup key: GSTIN + Invoice Number (normalized)
  2. Group invoices by lookup key
  3. If group size > 1:
     - Record as duplicate
     - Include all instances
     - Flag for manual review
```

### Example

**Books Data:**
```
Invoice 1: GSTIN: 27AAJCU9603R1Z5, Number: INV001, Amount: ₹1,000
Invoice 2: GSTIN: 27AAJCU9603R1Z5, Number: INV001, Amount: ₹1,000 (DUPLICATE)
Invoice 3: GSTIN: 27AAJCU9603R1Z5, Number: INV002, Amount: ₹2,000
```

**Result:**
- Duplicate detected: 2 invoices with same GSTIN + Invoice Number
- Reason: "2 invoices with GSTIN 27AAJCU9603R1Z5 and invoice number INV001"

---

## Fuzzy Matching

### When Used

When exact matching fails (no matching invoice number found).

Used to suggest possible matches with confidence scores.

### Similarity Score Calculation

```
Score = (30% GSTIN match) + (20% Invoice# similarity) 
       + (15% Date match) + (20% Taxable value) 
       + (15% Total value)
```

#### GSTIN Match (30%)
```
if Books.GSTIN == GSTR-2B.GSTIN:
  Score += 30
else:
  Score += 0
```

#### Invoice Number Similarity (20%)
```
Similarity = Levenshtein Distance Score (0-1)
Score += Similarity * 20

Example:
  Books: "INV-00123"
  2B: "INV00123"
  Similarity = 0.95 (95%)
  Score += 19
```

#### Date Match (15%)
```
if Books.Date == GSTR-2B.Date:
  Score += 15
else if DateDifference <= Tolerance (default 0):
  Score += 15
else:
  Score += 0
```

#### Taxable Value Match (20%)
```
if |Books.Taxable - GSTR-2B.Taxable| <= Tolerance (default ₹1):
  Score += 20
else:
  Score += 0
```

#### Total Value Match (15%)
```
if |Books.Total - GSTR-2B.Total| <= Tolerance (default ₹1):
  Score += 15
else:
  Score += 0
```

### Confidence Threshold

Default threshold: **90%**

```
if Score >= 90:
  Suggest as possible match
  Show confidence: {Score}%
else:
  Do not suggest
```

### Example

**Books Invoice:**
- GSTIN: 27AAJCU9603R1Z5
- Invoice: "INV-00123"
- Date: 2024-04-15
- Taxable: ₹1,000
- Total: ₹1,180

**GSTR-2B Invoice:**
- GSTIN: 27AAJCU9603R1Z5
- Invoice: "INV00123"
- Date: 2024-04-15
- Taxable: ₹1,000
- Total: ₹1,180

**Score Calculation:**
- GSTIN match: 30 points
- Invoice similarity (0.95): 19 points
- Date match: 15 points
- Taxable match: 20 points
- Total match: 15 points
- **Total: 99 points (99% confidence)** ✓ Suggest match

---

## Tolerance Settings

### Tax Tolerance
**Default**: ₹1
**Purpose**: Allow small rounding differences in tax amounts
**Apply to**: IGST, CGST, SGST, Cess

### Invoice Value Tolerance
**Default**: ₹1
**Purpose**: Allow small rounding differences in invoice totals
**Apply to**: Taxable Value, Total Invoice Value

### Date Tolerance
**Default**: 0 days
**Purpose**: Allow date variations (e.g., different invoice vs. receipt dates)
**Apply to**: Invoice Date comparison

### Fuzzy Match Threshold
**Default**: 90%
**Purpose**: Minimum confidence for suggesting possible matches
**Range**: 0-100%

---

## Data Normalization

Applied before all comparisons.

### GSTIN Normalization

```
1. Convert to uppercase
2. Trim leading/trailing spaces
3. Validate format: 15 alphanumeric characters
4. If invalid: Error recorded, invoice skipped
```

### Invoice Number Normalization

```
1. Convert to uppercase
2. Trim leading/trailing spaces
3. Replace multiple spaces with single space
4. Remove brackets and parentheses: () [] {}
5. Keep meaningful separators: / -
6. If empty after normalization: Error recorded
```

### Date Normalization

```
Accept formats:
  DD/MM/YYYY  →  2024-04-15
  DD-MM-YYYY  →  2024-04-15
  YYYY-MM-DD  →  2024-04-15
  Excel serial →  Convert to ISO
  ISO format  →  Keep as-is

If invalid: Error recorded, invoice skipped
```

### Numeric Normalization

```
1. Remove ₹ symbol
2. Remove commas (Indian format: 1,00,000)
3. Parse as float
4. Round to 2 decimals
5. If NaN: Error recorded
```

---

## Performance Optimization

### Indexed Lookups

```
Database indexes on:
- GSTIN
- Invoice Number
- GSTIN + Invoice Number (composite)
- Upload ID
- Upload File Type
```

### In-Memory Caching

```
1. Load invoices into memory
2. Build hash maps by GSTIN and Invoice Number
3. O(1) lookup time for exact matches
4. O(n log n) for fuzzy matching (Levenshtein)
```

### Batch Processing

```
For large files (50,000+ invoices):
1. Process in chunks of 5,000
2. Calculate intermediate results
3. Merge results
4. Progress indicator shown to user
```

---

## Error Handling

All errors are collected and reported, not stopping processing.

### Error Types

```
1. INVALID_FORMAT
   - Invalid GSTIN (not 15 chars)
   - Invalid date format
   - Invalid numeric value
   - Action: Skip invoice, record error

2. MISSING_REQUIRED
   - Missing GSTIN
   - Missing invoice number
   - Action: Skip invoice, record error

3. DATA_TYPE_MISMATCH
   - Non-numeric in amount field
   - Action: Try to coerce or skip

4. NORMALIZATION_FAILURE
   - Invoice number becomes empty after normalization
   - Action: Skip, record error
```

### Error Report

Included in reconciliation results:

```json
{
  "errors": [
    {
      "uploadId": "upload_123",
      "rowNumber": 5,
      "field": "gstin",
      "value": "invalid_gstin",
      "errorType": "INVALID_FORMAT",
      "message": "GSTIN must be 15 alphanumeric characters"
    }
  ]
}
```

---

## Example Reconciliation Flow

### Input

**Books:**
```
GSTIN            Invoice Number  Taxable  IGST  Total
27AAJCU9603R1Z5  INV-001         1000     180   1180
27AAJCU9603R1Z5  INV-002         2000     360   2360
18AABCR5055K1Z0  INV-103         5000     900   5900
```

**GSTR-2B:**
```
GSTIN            Invoice Number  Taxable  IGST  Total
27AAJCU9603R1Z5  INV-001         1000     180   1180
27AAJCU9603R1Z5  INV-002         2000     361   2361  (IGST differs by 1)
18AABCR5055K1Z0  INV-104         5000     900   5900  (Invoice number differs)
```

### Stage 1: GSTIN-wise

**GSTIN: 27AAJCU9603R1Z5**
- Books Total: ₹3,540 (1180 + 2360)
- GSTR-2B Total: ₹3,541 (1180 + 2361)
- Difference: ₹1 ≤ Tolerance (₹1)
- **Status: MATCHED** ✓

**GSTIN: 18AABCR5055K1Z0**
- Books Total: ₹5,900
- GSTR-2B Total: ₹5,900
- Difference: ₹0 ≤ Tolerance
- **Status: MATCHED** ✓

### Stage 2: Invoice-level

**GSTIN: 27AAJCU9603R1Z5, Invoice: INV-001**
- Lookup: 27AAJCU9603R1Z5|INV-001
- Match found in both
- All values match
- **Status: EXACT_MATCH** ✓

**GSTIN: 27AAJCU9603R1Z5, Invoice: INV-002**
- Lookup: 27AAJCU9603R1Z5|INV-002
- Match found in both
- IGST differs: ₹360 vs ₹361 (₹1 difference)
- Tolerance allows ₹1 difference
- **Status: EXACT_MATCH** ✓ (within tolerance)

**GSTIN: 18AABCR5055K1Z0, Invoice: INV-103**
- Lookup: 18AABCR5055K1Z0|INV-103
- No exact match in GSTR-2B
- Fuzzy match with INV-104:
  - GSTIN: Match (30 pts)
  - Invoice: 0.857 similarity (17 pts)
  - Amount: Match (20 pts)
  - **Score: 67%** < Threshold (90%)
- **Suggestion: POSSIBLE_MATCH (67% confidence)**

### Output

```json
{
  "summary": {
    "totalGstins": 2,
    "matched": 2,
    "mismatched": 0,
    "exactMatches": 2,
    "partialMatches": 0,
    "possibleMatches": 1
  },
  "gstinSummary": [
    {
      "gstin": "27AAJCU9603R1Z5",
      "status": "MATCHED"
    },
    {
      "gstin": "18AABCR5055K1Z0",
      "status": "MATCHED"
    }
  ],
  "possibleMatches": [
    {
      "booksInvoice": {"gstin": "18AABCR5055K1Z0", "invoiceNumber": "INV-103"},
      "gstr2bInvoice": {"gstin": "18AABCR5055K1Z0", "invoiceNumber": "INV-104"},
      "confidence": 67,
      "reason": "Similar invoice numbers (INV-103 vs INV-104)"
    }
  ]
}
```

---

## Advanced Topics

### Multi-period Reconciliation

Not supported in v1.0. Each project = one period.

Future: Support for rolling periods and year-over-year comparison.

### GSTIN Split

For multi-state businesses with multiple GSTINs.

Current behavior: Separate GSTIN = separate reconciliation.

### Partial Shipments

If one invoice is split into multiple in GSTR-2B:

Current: Marked as missing/mismatch.

Future: Support for invoice splitting and merging.

### Credit Notes

Negative invoices (credit notes):

Current: Treated as negative amounts (should work).

Future: Special handling for credit notes vs invoices.

---

## Troubleshooting

### Matches look wrong

1. Check normalization rules (uppercase, trim spaces)
2. Verify tolerance settings
3. Review error log for skipped invoices
4. Check for duplicates

### Too many mismatches

1. Increase tolerance settings
2. Review data quality
3. Check for format inconsistencies
4. Look for duplicate invoices

### Fuzzy matches not appearing

1. Lower fuzzy match threshold
2. Check invoice number format
3. Verify both invoices have same GSTIN
4. Check date tolerance

---

**Algorithm Version**: 1.0
**Last Updated**: 2024-04-01
