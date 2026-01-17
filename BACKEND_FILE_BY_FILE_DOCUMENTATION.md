# 📂 Backend File-by-File Documentation

This document provides a complete inventory of every file in the Python Backend (`/backend`), explaining its specific purpose and contents.

---

## 1. 🚀 Application Root (`backend/app/`)

*   **`main.py`**: The **Entry Point** of the application.
    *   Initializes the `FastAPI` app.
    *   Configures `CORSMiddleware` (allowing frontend access).
    *   Includes all Routers (`investor`, `admin`, `amc`, etc.).
    *   Creates database tables on startup.

### 🔐 Core Module (`backend/app/core/`)
Configuration and Security utilities.
*   **`config.py`**: Reads environment variables (DB URL, Secret Key) using `pydantic-settings`.
*   **`jwt.py`**: Contains functions to **create** (`create_access_token`) and **verify** (`get_current_user`) JSON Web Tokens.
*   **`security.py`**: Handles password hashing (`verify_password`, `get_password_hash`) using `bcrypt`.
*   **`rate_limit.py`**: Middleware or utility to prevent API abuse (RPM limits).

### 🗄️ Database Module (`backend/app/db/`)
*   **`session.py`**: Sets up the SQLAlchemy Engine and SessionLocal. Provides `get_db()` dependency.
*   **`base.py`**: Imports all Models so Alembic/SQLAlchemy can detect them for table creation.
*   **`init_db.py`**: Logic to initialize the DB with a superuser or initial data.

---

## 2. 🧱 Database Models (`backend/app/models/`)

Defines the SQL Tables.

*   **`user.py`**: `User` table. Stores login credentials (email, hashed_password, role).
*   **`investor.py`**: `Investor` table. Stores KYC details (PAN, Name, Address) linked to `User`.
*   **`folio.py`**: `Folio` table. Represents an account with a Mutual Fund (Units, Value).
*   **`transaction.py`**: `Transaction` table. The immutable ledger of Purchases, Redemptions, SIPs.
*   **`scheme.py`**: `Scheme` table. Master data of Mutual Funds (NAV, Min Investment).
*   **`amc.py`**: `AMC` table. Asset Management Companies (e.g., HDFC, SBI).
*   **`mandate.py`**: `SIPRegistration`, `STPRegistration`, etc. Stores recurring instruction details.
*   **`bank_account.py`**: `BankAccount` table. User's linked bank details.
*   **`document.py`**: `Document` table. Metadata for uploaded KYC/Proof files.
*   **`notification.py`**: `Notification` table. In-app alerts for users.
*   **`service_request.py`**: `ServiceRequest` table. User tickets (e.g., "Change Address").
*   **`complaint.py`**: `Complaint` table. Formal grievances.
*   **`support.py`**: `SupportTicket` table. Helpdesk queries.
*   **`admin.py`**: `Admin` table. Profile data for system administrators.
*   **`distributor.py`**: `Distributor` table. Agent/ARN holder profiles.
*   **`unclaimed.py`**: `UnclaimedAmount` table. Tracks dividend/redemption money not yet paid.
*   **`disclosure.py`**: `RegulatoryDisclosure` table. Compliance notices.

---

## 3. 📋 Pydantic Schemas (`backend/app/schemas/`)

Data definitions for API Request/Response validation.

*   **`auth.py`**: `Token`, `LoginRequest`.
*   **`transaction.py`**: `PurchaseRequest`, `RedemptionRequest`, `SIPSetupRequest`.
*   **`investor.py`**: `InvestorCreate`, `InvestorUpdate`, `ProfileResponse`.
*   **`folio.py`**: `FolioResponse`.
*   **`scheme.py`**: `SchemeResponse`, `NavUpdate`.
*   **`common.py`**: Shared enums or base classes.
*   *(Other files like `admin.py`, `support.py` match their respective Model fields exactly)*.

---

## 4. 🧠 Service Layer (`backend/app/services/`)

Contains the "Business Logic" separate from HTTP handling.

*   **`transaction_service.py`**: **Critical File**.
    *   `process_fresh_purchase()`: Logic to calc units and write DB.
    *   `process_redemption()`: Logic to lock row and debit units.
    *   `process_switch()`: Logic to link Buy/Sell.
    *   `process_sip_installment()`: Daily scheduled logic.
*   **`investor_service.py`**:
    *   `get_portfolio_summary()`: Aggregates folio values.
    *   `create_investor()`: Profile creation logic.
*   **`auth_service.py`**: User authentication and role verification logic.
*   **`mandate_service.py`**: Validates Bank Mandate limits for SIPs.
*   **`notification_service.py`**: Logic to push alerts to users.
*   **`email_service.py`**: Sends SMTP emails (OTP, Statement).
*   **`sms_service.py`**: Sends SMS via gateway.
*   **`nav_service.py`**: Updates Scheme NAVs from external APIs (e.g., AMFI).
*   **`service_request_service.py`**: Management of user tickets.

---

## 5. 🌐 API Routers (`backend/app/routers/`)

Handles HTTP Routes URL -> Function.

### 🧑‍💼 Investor Module (`routers/investor/`)
*   **`auth.py`**: `/login`, `/register`.
*   **`profile.py`**: `/profile`, `/dashboard`, `/bank-accounts`.
*   **`transactions.py`**: `/purchase`, `/redemption`, `/sip`, `/switch`.
*   **`reports.py`**: `/reports/cas`, `/reports/capital-gains`.
*   **`service_requests.py`**: `/service-requests` (CRUD).
*   **`complaints.py`**: `/complaints` (Lodge/View).
*   **`notifications.py`**: `/notifications` (Read/Clear).

### 👮 Admin Module (`routers/admin/`)
*   **`dashboard.py`**: Global AUM stats, User counts.
*   **`approvals.py`**: Endpoints to Approve/Reject large transactions.
*   **`user_management.py`**: Block/Unblock users.
*   **`system_settings.py`**: Configure global variables.

### 🏦 AMC & Distributor Modules
*   **`routers/amc/`**: Endpoints for Fund Houses to upload NAVs/Schemes.
*   **`routers/distributor/`**: Endpoints for Agents to view client portfolios.

---

## 6. 🛠️ Root Scripts (`backend/`)

*   **`seed_master_data.py`**: Script to pre-fill the DB with dummy Schemes, AMCs, and Admin users.
*   **`check_schema.py`**: Diagnostic script to verify DB tables match Models.
*   **`debug_db.py`**: Quick script to test DB connection.
*   **`requirements.txt`**: List of Python dependencies (`fastapi`, `sqlalchemy`, `psycopg2`, etc.).
