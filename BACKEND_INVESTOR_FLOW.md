# 🏗️ RTA Investor Backend: Complete Structure & Flow Guide

This document provides a deep-dive explanation of the **Investor Backend** architecture for the RTA Management System. It explains exactly how data flows from the moment an investor clicks a button to when it is saved in the database.

---

## 1. 🌍 High-Level Architecture (The "Big Picture")

The backend is built using **FastAPI** (a modern, high-performance Python framework). It follows a **Layered Architecture** designed for separation of concerns.

### The Stack:
*   **Web Framework**: FastAPI (Handles HTTP requests/responses, Validation).
*   **Database ORM**: SQLAlchemy (Talks to the PostgreSQL database using Python classes).
*   **Data Validation**: Pydantic (Ensures data sent by the frontend is correct before processing).
*   **Security**: OAuth2 with JWT Tokens (Secures every endpoint).

### The General "Flow" of Data:
1.  **Router**: Receives the request (e.g., "Buy Fund").
2.  **Dependency**: Checks if the user is logged in (`get_current_user`).
3.  **Schema Validation**: Checks if the input data (Amount, Scheme) is valid.
4.  **Business Logic**: Calculates charges, validates balances, creates records.
5.  **Database Session**: Commits changes to the SQL database.
6.  **Response**: Sends the result back as JSON.

---

## 2. 🚦 The Entry Point (`app/main.py`)

Every request starts here.
*   **`app = FastAPI(...)`**: Initializes the application.
*   **`CORSMiddleware`**: Configured to allow your Frontend (running on port 5173 or 3000) to talk to this Backend. Without this, the browser would block requests.
*   **`app.include_router(...)`**: This file acts as a traffic controller. It sees a request to `/api/investor/...` and directs it specifically to the **Investor Module**.

---

## 3. 👤 The Auth Module (`app/routers/investor/auth.py`)

This is the gatekeeper. No one enters without passing through here first.

### Key Workflows:
1.  **Registration (`/register`)**:
    *   Accepts `InvestorRegisterSchema` (Email, Name, Pan, Password).
    *   Hashes the password (security best practice).
    *   Creates a new `User` row in the database with `role="investor"`.
2.  **Login (`/login`)**:
    *   Accepts Email/Password.
    *   Verifies credentials against the DB.
    *   **Crucial Step**: Generates an **Access Token (JWT)**. This token is the user's "ID Card" for all future requests.

---

## 4. 💼 The Core Logic Modules (`app/routers/investor/`)

Once authenticated, requests go to these specific files based on functionality.

### A. Profile & Dashboard (`profile.py`)
*   **Purpose**: Manages static user data and the main dashboard view.
*   **Key Endpoints**:
    *   `GET /dashboard`: Fetches a summary of all investments. It queries the `Portfolio` table, sums up current values, and calculates Gain/Loss percentages on the fly.
    *   `POST /bank-accounts`: Adds a new bank account. It validates the IFSC code format and saves it to the `BankAccount` table.
    *   `GET /nominees`: detailed list of appointed nominees.

### B. Transactions Engine (`transactions.py`)
*   **Purpose**: This is the **heart** of the system. It handles actual money movement (Purchase, Redemption, Switch, SIP, SWP, STP).
*   **Flow for a "Purchase" Request**:
    1.  **Frontend sends**: `{ scheme_code: "INF...", amount: 5000 }`.
    2.  **Validation**: Checks if the Scheme exists and allows purchases.
    3.  **Folio Logic**: Checks if user has an existing Folio for this AMC. If not, creates a NEW Folio.
    4.  **Transaction Record**: Creates a `Transaction` entry with status `PENDING`.
    5.  **Unit Calculation**: Fetches the latest NAV (Net Asset Value) for the scheme -> Calculates `Units = Amount / NAV`.
    6.  **Allocation**: Updates the `Portfolio` table to add these new units to the user's holdings.

### C. Reporting Module (`reports.py`)
*   **Purpose**: Read-only data aggregation for statements.
*   **Key Features**:
    *   **CAS (Consolidated Account Statement)**: Joins `User`, `Folio`, and `Transaction` tables to create a chronological ledger of every action.
    *   **Capital Gains**: detailed algorithm that compares "Buy Date/Price" vs "Sell Date/Price" to calculate Short Term vs Long Term Capital Gains (STCG/LTCG).

### D. Service Modules
*   **`mandates.py`**: Handles "One Time Mandate" (OTM) registrations for auto-debits.
*   **`complaints.py`**: A helper module to allow investors to raise tickets `Complaint` table.
*   **`folios.py`**: Specifically for viewing details of a single Folio (investor account with a fund house).

---

## 5. 🛠️ The Database Structure (Models)

The "Brain" of the backend is how data is structured in `app/models/`.

1.  **User**: The central entity.
    *   *One User has Many Folios.*
2.  **Folio**: An account with a specific Asset Management Company (AMC).
    *   *One Folio has Many Transactions.*
    *   *One Folio has Many Portfolio Entries (Holdings).*
3.  **Scheme**: Master data of Mutual Funds (Name, Code, NAV).
4.  **Transaction**: The history log (Purchase of X units at Y price on Z date).
5.  **Portfolio**: The "Current State" summary. (User U owns N units of Scheme S).

---

## 6. 🔄 Complete Walkthrough: "A Purchase Journey"

Here is exactly what happens in the backend code when you click "Invest Now":

1.  **Request Arrival**:
    *   `POST /api/investor/transaction/purchase` arrives at `transactions.py`.
2.  **Security Check**:
    *   The `get_current_user` dependency looks at the Header `Authorization: Bearer <token>`.
    *   It decodes it to find `user_id=123`.
3.  **Input Parsing**:
    *   Pydantic checks the JSON body. Is `amount` a positive number? Is `scheme_id` valid?
4.  **Database Start**:
    *   A DB Session `db` is opened.
5.  **Execution Logic**:
    *   Code checks `latest_nav` for the scheme.
    *   Calculates `units_alloted = amount / nav`.
    *   **INSERT** into `transactions` table (Type: 'PURCHASE', Status: 'COMPLETED').
    *   **UPDATE/INSERT** into `portfolio` table (Increments `total_units` and `current_value`).
6.  **Commit**:
    *   `db.commit()` is called. This permanently saves changes to PostgreSQL.
7.  **Return**:
    *   Returns JSON: `{ "status": "success", "transaction_id": 999 }`.

---

## 7. 📁 Directory Map for Quick Reference

*   `backend/app/main.py`: **Start Here** (Router configuration).
*   `backend/app/db/base.py`: **Database Tables** (All model imports).
*   `backend/app/routers/investor/transactions.py`: **Business Logic** (Where the complex math happens).
*   `backend/app/routers/investor/auth.py`: **Login Logic**.
*   `backend/app/schemas/`: **Data Contracts** (What the API expects vs returns).

This structure ensures that the Investor Backend is secure, organized, and scalable, separating the "Web" logic (Routers) from the "Data" logic (Models).
