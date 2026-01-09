# RTA System - Project Architecture Documentation

## Overview
This is a **Registrar and Transfer Agent (RTA) System** for Indian Mutual Funds. It manages investor accounts, folios, transactions, and all related operations for a mutual fund RTA.

**Note on ID Simplicity**: The IDs (I001, F001, T001) are intentionally simple and match the RTA documentation. This simplicity is a strength - it makes the system easier to understand, maintain, and debug. Complex IDs with encoded information are not required for a functional RTA system.

---

## Core Concepts

### 1. ID Generation Patterns

All business IDs use a **sequential pattern** based on the auto-incrementing database `id` field:

#### **Investor ID** (`investor_id`)
- **Pattern**: `I001`, `I002`, `I003`, ...
- **Generation**: Based on `Investor.id` (auto-increment)
- **Location**: `backend/app/services/investor_service.py::generate_investor_id()`
- **Format**: `I{next_id:03d}` (e.g., I001, I002, I099, I100)
- **Uniqueness**: Enforced at database level with `unique=True`

#### **Folio Number** (`folio_number`)
- **Pattern**: `F001`, `F002`, `F003`, ...
- **Generation**: Based on `Folio.id` (auto-increment)
- **Location**: `backend/app/services/transaction_service.py::generate_folio_number()`
- **Special Logic**: 
  - **Checks for existing folio** first: If a folio exists for `(investor_id, amc_id, scheme_id)` combination, returns existing folio_number
  - Only creates new folio_number if combination doesn't exist
  - Format: `F{next_id:03d}`
- **Business Rule**: One folio per investor-scheme-AMC combination

#### **Transaction ID** (`transaction_id`)
- **Pattern**: `T001`, `T002`, `T003`, ...
- **Generation**: Based on `Transaction.id` (auto-increment)
- **Location**: `backend/app/services/transaction_service.py::generate_transaction_id()`
- **Format**: `T{next_id:03d}`

#### **AMC ID** (`amc_id`)
- **Pattern**: `A001`, `A002`, `A003`, ...
- **Generation**: **Manually seeded** in `backend/app/db/init_db.py`
- **Seed Data**: Pre-defined AMCs (A001-A005)
- **Purpose**: Master data - Asset Management Companies

#### **Scheme ID** (`scheme_id`)
- **Pattern**: `S001`, `S002`, `S003`, ...
- **Generation**: **Manually seeded** in `backend/app/db/init_db.py`
- **Seed Data**: Pre-defined schemes (S001-S006)
- **Purpose**: Master data - Mutual Fund Schemes
- **Relationship**: Each scheme belongs to one AMC (`amc_id` foreign key)

---

## Database Structure

### Base Model Structure

All models inherit from `BaseModel` which provides:
```python
- id: Integer (primary key, auto-increment)
- created_at: DateTime (auto-set on creation)
- updated_at: DateTime (auto-updated on modification)
```

### Entity Relationships

```
AMC (Asset Management Company)
  ├── has_many → Scheme
  ├── has_many → Folio
  └── has_many → User (for AMC users)

Scheme (Mutual Fund Scheme)
  ├── belongs_to → AMC (amc_id)
  ├── has_many → Folio
  └── has_many → Transaction

Investor
  ├── has_one → User (authentication)
  ├── has_many → Folio
  ├── has_many → Transaction
  ├── has_many → BankAccount
  ├── has_many → Nominee
  ├── has_many → Document
  ├── has_many → SIPRegistration
  ├── has_many → SWPRegistration
  ├── has_many → STPRegistration
  └── has_many → UnclaimedAmount

Folio (Investor's holding in a scheme)
  ├── belongs_to → Investor (investor_id)
  ├── belongs_to → AMC (amc_id)
  ├── belongs_to → Scheme (scheme_id)
  └── has_many → Transaction
  
  **KEY BUSINESS RULE**: 
  - One folio per (investor_id, amc_id, scheme_id) combination
  - Folio tracks: total_units, total_investment, total_value, average_cost_per_unit
  - Status: active, inactive, suspended, closed

Transaction
  ├── belongs_to → Investor (investor_id)
  ├── belongs_to → Folio (folio_number) - optional (for non-financial transactions)
  ├── belongs_to → Scheme (scheme_id)
  ├── belongs_to → AMC (amc_id)
  └── Types: purchase, redemption, sip, swp, stp, switch, idcw_payout, etc.

User (Authentication)
  ├── belongs_to → Investor (investor_id) - one-to-one for investors
  └── belongs_to → AMC (amc_id) - for AMC users
```

---

## Folio System - Deep Dive

### What is a Folio?
A **Folio** represents an investor's holdings in a specific mutual fund scheme. It's the primary container for tracking:
- Units held in a scheme
- Total investment amount
- Current value
- Average cost per unit
- Transaction history

### Folio Creation Logic

**Critical Understanding**:

1. **Folio is created when first purchase happens**:
   - When investor makes first purchase in a scheme, system checks if folio exists
   - If not exists: Creates new folio with generated folio_number
   - If exists: Updates existing folio with new units

2. **Folio Uniqueness**:
   ```python
   # One folio per (investor_id, amc_id, scheme_id)
   existing_folio = db.query(Folio).filter(
       Folio.investor_id == investor_id,
       Folio.amc_id == amc_id,
       Folio.scheme_id == scheme_id
   ).first()
   ```

3. **Folio Number Generation**:
   - Generated sequentially: F001, F002, F003...
   - But reused if folio already exists for the combination
   - This ensures one folio per investor-scheme

### Folio Fields Explained

```python
folio_number: String(15) - Unique identifier (F001, F002, ...)
investor_id: String(10) - Links to Investor (I001, I002, ...)
amc_id: String(10) - Links to AMC (A001, A002, ...)
scheme_id: String(10) - Links to Scheme (S001, S002, ...)

# Holdings
total_units: DECIMAL(15,4) - Current units held
current_nav: DECIMAL(10,4) - NAV at last update
total_value: DECIMAL(15,2) - total_units * current_nav

# Cost Basis
total_investment: DECIMAL(15,2) - Total money invested
average_cost_per_unit: DECIMAL(10,4) - total_investment / total_units

# Status
status: Enum (active, inactive, suspended, closed)
idcw_option: String (payout, reinvestment)
transaction_count: Integer
last_transaction_date: Date
```

### Folio Update Scenarios

1. **Fresh Purchase** (first purchase in scheme):
   - Creates new folio
   - Sets total_units, total_investment = purchase amount
   - average_cost_per_unit = NAV

2. **Additional Purchase** (existing folio):
   - Updates existing folio
   - total_units += new_units
   - total_investment += new_amount
   - Recalculates average_cost_per_unit

3. **Redemption**:
   - total_units -= redeemed_units
   - total_investment remains same (FIFO/LIFO not implemented)
   - total_value recalculated
   - If total_units = 0, folio status = "closed"

---

## Schema System (Pydantic Schemas)

### Purpose
Pydantic schemas (`backend/app/schemas/`) are used for:
1. **API Request Validation**: Validate incoming data from frontend
2. **Data Serialization**: Convert models to JSON responses
3. **Type Safety**: Ensure correct data types

### Schema Categories

#### 1. **Request Schemas** (Input)
- `InvestorCreate`: For creating new investor
- `InvestorUpdate`: For updating investor (all fields optional)
- `PurchaseRequest`: For purchase transactions
- `RedemptionRequest`: For redemption transactions
- `BankAccountCreate`, `NomineeCreate`: For adding bank/nominee

#### 2. **Response Schemas** (Output)
- `InvestorInDB`: Full investor data for responses
- `BankAccountInDB`: Bank account data
- `NomineeInDB`: Nominee data
- `TransactionResponse`: Transaction data

### Schema Validation Rules

**Example - PurchaseRequest**:
```python
scheme_id: Must match pattern ^SCH\d{3}$ (but actually uses S001, S002...)
amount: Must be > 0, between 100 and 10,00,000
plan: Must be Growth|IDCW Payout|IDCW Reinvestment
payment_mode: Enum (net_banking, upi, debit_mandate, etc.)
```

**Note**: There's a mismatch - schemas validate `SCH001` pattern but actual IDs use `S001`. This needs to be aligned.

---

## Master Data Hierarchy

### Seeding Order (Critical!)

```
1. AMC (A001, A002, ...) - Must exist first
   ↓
2. Scheme (S001, S002, ...) - Depends on AMC
   ↓
3. Investor (I001, I002, ...) - Independent
   ↓
4. Folio (F001, F002, ...) - Depends on Investor, AMC, Scheme
   ↓
5. Transaction (T001, T002, ...) - Depends on Investor, Folio, Scheme
```

### Master Data Seeding (`backend/app/db/init_db.py`)

1. **AMCs** (5 AMCs): A001-A005
   - Visionary Mutual Fund, Progressive AMC, Horizon Fund House, Pinnacle Funds, Star Capital MF

2. **Schemes** (6 Schemes): S001-S006
   - Each linked to an AMC
   - Different types: equity, debt, hybrid
   - Different options: growth, idcw_payout, idcw_reinvestment

3. **Investors** (5 Investors): I001-I005
   - Pre-created with KYC data
   - Linked to Users for authentication

4. **Folios** (5 Folios): F001-F005
   - Pre-created empty folios
   - Linked to investors and schemes

---

## Transaction Flow

### Purchase Flow

```
1. Frontend sends PurchaseRequest:
   - scheme_id (S001)
   - amount (₹10,000)
   - plan (Growth)
   - payment_mode

2. Backend (TransactionService.process_fresh_purchase):
   a. Validates scheme exists and is open
   b. Gets current NAV from Scheme
   c. Calculates units = amount / NAV
   d. Generates transaction_id (T001, T002, ...)
   e. Generates/gets folio_number:
      - Checks if folio exists for (investor_id, amc_id, scheme_id)
      - If exists: reuse folio_number
      - If not: generate new (F001, F002, ...)
   f. Creates Transaction record
   g. Creates or updates Folio:
      - If new: Creates folio with units, investment
      - If exists: Adds units, updates investment
   h. Commits to database
```

### Redemption Flow

```
1. Frontend sends RedemptionRequest:
   - folio_number (F001)
   - amount OR units OR all_units

2. Backend:
   a. Gets folio by folio_number
   b. Validates folio belongs to investor
   c. Gets current NAV
   d. Calculates redemption units/amount
   e. Checks exit load (if applicable)
   f. Creates Transaction record
   g. Updates Folio:
      - total_units -= redeemed_units
      - If total_units = 0: status = "closed"
   h. Commits to database
```

---

## ID Format Reference

| Entity | ID Field | Format | Example | Generation |
|--------|----------|--------|---------|------------|
| Investor | investor_id | I{nnn} | I001, I002 | Auto (from id) |
| Folio | folio_number | F{nnn} | F001, F002 | Auto (from id), but reused if exists |
| Transaction | transaction_id | T{nnn} | T001, T002 | Auto (from id) |
| AMC | amc_id | A{nnn} | A001, A002 | Manual seed |
| Scheme | scheme_id | S{nnn} | S001, S002 | Manual seed |

**Where {nnn} = 3-digit zero-padded number**

---

## Key Business Rules

### 1. Folio Rules
- ✅ One folio per (investor_id, amc_id, scheme_id) combination
- ✅ Folio number reused if combination already exists
- ✅ Folio tracks cumulative investment and units
- ✅ Folio closed when units = 0

### 2. Transaction Rules
- ✅ All transactions create Transaction records
- ✅ Financial transactions update Folio
- ✅ Non-financial transactions (KYC, address update) don't affect Folio
- ✅ Transaction IDs are sequential and unique

### 3. ID Generation Rules
- ✅ All business IDs based on auto-increment `id` field
- ✅ Format: {prefix}{3-digit-number}
- ✅ Folio number has special reuse logic
- ✅ Master data (AMC, Scheme) manually seeded

### 4. Data Integrity Rules
- ✅ Foreign keys enforce referential integrity
- ✅ Unique constraints on business IDs
- ✅ Unique constraints on PAN, Email
- ✅ Cascading deletes configured appropriately

---

## API Endpoint Structure

```
/api/v1/investor/
  ├── /auth/
  │   ├── POST /register
  │   ├── POST /login
  │   ├── POST /change-password
  │   └── POST /forgot-password
  │
  ├── /profile/
  │   ├── GET / (get profile)
  │   ├── PUT / (update profile)
  │   ├── GET /dashboard
  │   ├── POST /bank-accounts
  │   ├── PUT /bank-accounts/{account_id}
  │   ├── DELETE /bank-accounts/{account_id}
  │   ├── POST /nominees
  │   ├── PUT /nominees/{nominee_id}
  │   ├── DELETE /nominees/{nominee_id}
  │   ├── GET /documents
  │   ├── POST /documents
  │   ├── GET /documents/{id}/download
  │   └── DELETE /documents/{id}
  │
  ├── /folios/
  │   ├── GET / (list folios)
  │   ├── GET /{folio_number} (folio details)
  │   ├── GET /{folio_number}/holdings
  │   └── GET /{folio_number}/transactions
  │
  ├── /transactions/
  │   ├── POST /purchase
  │   ├── POST /redemption
  │   ├── POST /sip/setup
  │   ├── GET /history
  │   └── GET /folio/{folio_number}
  │
  └── /reports/
      ├── GET /capital-gains
      ├── GET /valuation
      └── GET /cas/download
```

---

## Schema vs Model Mismatch Issues

### Issue 1: Scheme ID Pattern - ✅ FIXED
- **Schema validation**: Now correctly expects `S001`, `S002` (pattern `^S\d{3}$`)
- **Actual data**: Uses `S001`, `S002`
- **Status**: Fixed - schemas now match actual data format

### Issue 2: Folio Number Pattern
- **Schema validation**: Expects `F001`, `F002` (pattern `^F\d{3}$`)
- **Actual generation**: Uses `F{next_id:03d}` ✅ **Matches**

---

## Critical Code Locations

### ID Generation
- `backend/app/services/investor_service.py::generate_investor_id()` - Investor IDs
- `backend/app/services/transaction_service.py::generate_transaction_id()` - Transaction IDs
- `backend/app/services/transaction_service.py::generate_folio_number()` - Folio numbers

### Folio Creation/Update
- `backend/app/services/transaction_service.py::process_fresh_purchase()` - Creates/updates folio on purchase
- `backend/app/services/transaction_service.py::process_redemption()` - Updates folio on redemption

### Master Data
- `backend/app/db/init_db.py::seed_master_data()` - Initial data seeding
- `backend/app/db/init_db.py::seed_amcs()` - AMC master data
- `backend/app/db/init_db.py::seed_schemes()` - Scheme master data

---

## Important Notes for Development

1. **Always check if folio exists** before creating new one
2. **Master data (AMC, Scheme) must exist** before creating folios/transactions
3. **IDs are sequential** - don't hardcode them
4. **Folio number reuse** is intentional - one per investor-scheme
5. **Transaction history** is immutable - never update/delete
6. **Foreign keys** ensure data integrity - always use valid IDs
7. **Schema validation** happens at API layer - ensures data quality

---

## Database Tables Overview

| Table | Primary Key | Business Key | Purpose |
|-------|-------------|--------------|---------|
| investor_master | id | investor_id (I001...) | Investor data |
| users | id | email | Authentication |
| amc_master | id | amc_id (A001...) | AMC master data |
| scheme_master | id | scheme_id (S001...) | Scheme master data |
| folio_holdings | id | folio_number (F001...) | Investor holdings |
| transaction_history | id | transaction_id (T001...) | All transactions |
| bank_accounts | id | - | Bank accounts |
| nominees | id | - | Nominee data |
| documents | id | - | Document storage |

---

This architecture ensures:
- ✅ Data integrity through foreign keys
- ✅ Unique business IDs through constraints
- ✅ Proper relationships between entities
- ✅ Sequential ID generation
- ✅ Reusable folio numbers
- ✅ Comprehensive transaction tracking

