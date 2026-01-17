# 🗄️ RTA Investor Backend: Complete Project Documentation

This comprehensive documentation details the internal structure of the Investor Backend, covering all tables, fields, schemas, functions, and router connections.

---

## 1. 🏗️ High-Level Project Structure

The project uses a standard FastAPI layered structure:
*   **Routers (`routers/`)**: Handle HTTP requests and routing.
*   **Services (`services/`)**: Contain core business logic.
*   **Models (`models/`)**: Define database tables (ORM).
*   **Schemas (`schemas/`)**: Define Pydantic models for request/response validation.

---

## 2. 🗃️ Database Tables & Models (`app/models/`)

The database is built on PostgreSQL using SQLAlchemy. Below are the core tables for the Investor module.

### A. `investor_master` (Model: `Investor`)
The central table for investor profiles.
*   **Primary Key**: `investor_id` (String, e.g., 'I001')
*   **Core Fields**:
    *   `pan_number` (Unique Index): Critical for identity.
    *   `full_name`, `date_of_birth`: Personal details.
    *   `email`, `mobile_number`: Contact info (Unique).
    *   `kyc_status` (Enum): `not_started`, `verified`, `rejected`.
*   **Relationships**:
    *   `folios`: One-to-Many link to `Folio`.
    *   `bank_accounts`: One-to-Many link to `BankAccount`.
    *   `transactions`: One-to-Many link to `Transaction`.

### B. `folio_holdings` (Model: `Folio`)
Represents an investor's account with a specific Mutual Fund Scheme.
*   **Primary Key**: `folio_number` (String, e.g., 'F001')
*   **Foreign Keys**:
    *   `investor_id` -> `investor_master.investor_id`
    *   `scheme_id` -> `scheme_master.scheme_id`
*   **Holdings Fields**:
    *   `total_units`: Decimal(15,4). The quantity owned.
    *   `current_nav`: Decimal(10,4). Latest price per unit.
    *   `total_value`: Computed (`total_units * current_nav`).
    *   `average_cost_per_unit`: Used for Capital Gains calculations.
*   **Status**: `active`, `closed`.

### C. `transaction_history` (Model: `Transaction`)
The immutable ledger of all financial actions.
*   **Primary Key**: `transaction_id` (String, e.g., 'T001')
*   **Foreign Keys**: `investor_id`, `folio_number`, `scheme_id`.
*   **Core Fields**:
    *   `transaction_type`: Enum (`fresh_purchase`, `redemption`, `sip`, etc.).
    *   `amount`: Value of transaction.
    *   `units`: Units added (positive) or removed (negative).
    *   `nav_per_unit`: The price at execution.
    *   `status`: `pending`, `completed`, `failed`.
    *   `linked_transaction_id`: Links two records (e.g., Switch Out -> Switch In).

### D. `sip_registrations` (Model: `SIPRegistration`)
Master table for Systematic Investment Plans.
*   **Fields**: `registration_id`, `frequency` (Monthly/Weekly), `amount`, `next_installment_date`.
*   **Logic**: `TransactionService` checks this table daily to create new `Transaction` entries.

---

## 3. 📋 Data Schemas (`app/schemas/`)

Pydantic models ensure type safety and validation between Frontend and Backend.

*   **`PurchaseRequest`**: Validates `amount > 100`, `scheme_id` exists.
*   **`RedemptionRequest`**: Requires exactly one of `units`, `amount`, or `all_units=True`.
*   **`SIPSetupRequest`**: Validates frequency enum and future dates.
*   **`PortfolioSummary`**: Output schema aggregating `total_investment`, `current_value`, and list of `folios`.

---

## 4. ⚙️ Functions & Services (`app/services/`)

The detailed logic is encapsulated in Service classes.

### `TransactionService` (The Core Engine)
*   **`process_fresh_purchase(investor_id, scheme_id, amount)`**:
    1.  Validates Scheme status.
    2.  Calls `get_or_create_folio()`.
    3.  Calculates `units = amount / nav`.
    4.  Creates `Transaction` record.
    5.  Updates `Folio` balances.
    6.  Commits to DB.
*   **`process_redemption(folio_number, units/amount)`**:
    1.  Locks Folio row.
    2.  Checks sufficiency of balance.
    3.  Debits units.
    4.  Closes Folio if balance hits 0.
*   **`process_switch(...)`**:
    1.  Atomically executes a Redemption on Source Folio.
    2.  Executes Purchase on Target Scheme.
    3.  Links transaction IDs.

### `InvestorService`
*   **`get_portfolio_summary(investor_id)`**:
    *   Aggregates all Active Folios.
    *   Sums `total_value` and `total_investment`.

---

## 5. 🔗 Router Connections (`app/routers/investor/`)

How URLs map to Python functions.

| Method | Endpoint | Python Function | Logic Chain |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/investor/transaction/purchase` | `purchase_units` | Router -> `TransactionService.process_fresh_purchase` -> DB |
| **POST** | `/api/investor/transaction/redemption` | `redeem_units` | Router -> `TransactionService.process_redemption` -> DB |
| **GET** | `/api/investor/profile/dashboard` | `get_dashboard` | Router -> `InvestorService.get_portfolio_summary` -> DB |
| **POST** | `/api/investor/sip` | `setup_sip` | Router -> `TransactionService.setup_sip` -> DB |

---

## 6. 🌐 End-to-End Interlinking

**Scenario: User clicks "Redeem"**

1.  **Frontend**: `Redemption.jsx` sends JSON `{ "folio_number": "F001", "units": 50 }`.
2.  **Router**: `investor/transactions.py` receives request.
3.  **Auth**: `get_current_investor` ensures user owns Folio F001.
4.  **Service**: `TransactionService` calculates value (`50 * NAV`).
5.  **Database**:
    *   `INSERT INTO transaction_history ... TYPE='REDEMPTION'`
    *   `UPDATE folio_holdings SET total_units = total_units - 50 ...`
6.  **Response**: Returns Transaction ID "T005".

This structure ensures reliable, ACID-compliant financial operations separate from the web interface logic.
