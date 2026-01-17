# 📘 RTA Investor Backend: The "Deep Dive" Master Manual

This document is the **single source of truth** for understanding the Investor Backend end-to-end. It details every layer of the specific "Investor Portal" implementation, explaining *what* code exists, *why* it is there, and *how* it processes data.

---

## 🏗️ Architecture Overview

The backend uses a **Service-Repository Pattern** (implemented via direct ORM usage + Service classes).

1.  **Router Layer** (`app/routers/investor/`): Endpoint definitions. Accepts HTTP, validates tokens, calls Services.
2.  **Service Layer** (`app/services/`): Pure business logic. Does the math, validations, and complex decision trees.
3.  **Data Layer** (`app/models/`): SQLAlchemy classes defining Database Tables.
4.  **Interface Layer** (`app/schemas/`): Pydantic models defining input/output JSON structures.

---

## 🧐 Module-by-Module Breakdown

### 1. 🔐 Authentication (`app/routers/investor/auth.py`)

*   **Role**: The Gateway.
*   **Key Logic**:
    *   **Login**: Accepts Email/Password. Queries `User` table. If hash matches, creates `access_token` (JWT) containing `user_id` and `role='investor'`.
    *   **Register**: Hashes password using DefaultPasslibCryptContext. Creates new `User` and `Investor` profile rows transactionally.
*   **End-To-End Flow**:
    *   `POST /login` -> `authenticate_user()` -> `create_access_token()` -> Returns `{ "access_token": "ey..." }`.
    *   Result: Frontend saves this token to verify identity in *all* subsequent requests.

### 2. 💰 Transactions Engine (`app/routers/investor/transactions.py` & `app/services/transaction_service.py`)

*   **Role**: The Core Logic Center. Handles all money movement.
*   **Key Services Methods**:
    *   **`process_fresh_purchase`**:
        *   **Input**: `amount`, `scheme_id`.
        *   **Logic**:
            1.  Finds `Scheme` by ID. Checks if `is_open_for_investment`.
            2.  Calls `get_or_create_folio`. Creates new `Folio` row if user doesn't have one for this AMC.
            3.  Calculates `units = amount / scheme.current_nav`.
            4.  Writes `Transaction` row (Type="PURCHASE").
            5.  Updates `Folio` totals (`total_investment`, `total_units`).
        *   **Output**: Transaction ID and Folio Number.
    *   **`process_redemption`**:
        *   **Logic**:
            1.  Locks Folio row (`with_for_update`) to prevent double-spending.
            2.  Checks `total_units`. If sufficient, calculates `redemption_amount`.
            3.  Writes `Transaction` row (Type="REDEMPTION").
            4.  Subtracts units from `Folio`. Closes folio if units reach 0.
    *   **`process_switch`**:
        *   **Logic**: A composite operation.
        *   Executes `process_redemption` on Source Scheme.
        *   Executes `process_fresh_purchase` on Target Scheme using the proceeds.
        *   Links the two transactions via `linked_transaction_id`.

### 3. 🔄 Systematic Plans (`app/routers/investor` -> `transactions.py` handling SIP/SWP)

*   **Role**: Automating recurring tasks.
*   **Key Logic**:
    *   **`setup_sip`**:
        *   Validates Mandate (OTM) limit using `MandateService`.
        *   Creates `SIPRegistration` row with `next_installment_date`.
        *   If `start_date == today`, triggers `process_fresh_purchase` immediately.
    *   **`setup_stp`** (Systematic Transfer):
        *   Creates `STPRegistration`.
        *   Logic: Periodically triggers a `Switch` transaction (Redeem Source -> Buy Target).

### 4. 📂 Profile & Folio Management (`app/routers/investor/profile.py`)

*   **Role**: Read-heavy operations for Dashboard.
*   **Key Logic**:
    *   **Dashboard**:
        *   Queries `Folio` table for `investor_id`.
        *   Aggregates `total_value` vs `total_investment` to show Gain/Loss.
    *   **Nominee Management**: CRUD operations on `Nominee` table.

---

## 🔌 API Interface Specifications (`app/schemas/`)

We enforce strict data contracts using Pydantic. This ensures "Garbage In" never happens.

*   **`PurchaseRequest`**:
    *   `scheme_id`: String (Required).
    *   `amount`: Decimal (Must be > 100).
    *   `plan`: String ("Growth" | "IDCW").
*   **`SIPSetupRequest`**:
    *   `frequency`: Enum ("Monthly", "Weekly").
    *   `bank_account_id`: Int (Must be valid/active).

---

## 🗄️ Database Schema Relationships (`app/models/`)

The backbone of the system.

1.  **`User`** (1) <---> (1) **`Investor`**
    *   Splits login info (email/pass) from business info (PAN, KYC status).
2.  **`Investor`** (1) <---> (N) **`Folio`**
    *   One investor can hold multiple folios.
3.  **`Folio`** (1) <---> (N) **`Transaction`**
    *   Every purchase/sale is logged under a specific Folio.
4.  **`Folio`** (1) <---> (1) **`Scheme`**
    *   A Folio is specifically tied to *one* Mutual Fund Scheme.
5.  **`Mandate`** (1) <---> (N) **`SIPRegistration`**
    *   One Bank Mandate can support multiple SIPs (up to its limit).

---

## 🔄 End-to-End "Life of a Request"

**Example: User sets up a monthly SIP of ₹5,000.**

1.  **Frontend**:
    *   User fills form on `SIPSetup.jsx`.
    *   `AuthContext` sends `POST /api/investor/sip` with Bearer Token.
2.  **FastAPI Router (`transactions.py`)**:
    *   `get_current_investor` validates token.
    *   `setup_sip` function is called.
3.  **Transaction Service (`transaction_service.py`)**:
    *   **Step 1**: Check `MandateService`. Is the Bank Account approved? Is Limit >= 5000?
    *   **Step 2**: Create `SIPRegistration` in DB (Status: Active, Next Date: Start Date).
    *   **Step 3 (Immediate)**: If Start Date is today, call `process_fresh_purchase`.
    *   **Step 4**: Update `SIPRegistration` (Installments Completed: 1).
4.  **Database**:
    *   Inserts row in `sip_registrations`, `transactions`.
    *   Updates row in `folios`.
    *   Commits change.
5.  **Response**:
    *   Returns JSON `{ "message": "SIP Registered", "sip_id": "SIP001" }`.

---
*This manual covers the complete logical & code structure of the RTA Investor Backend.*
