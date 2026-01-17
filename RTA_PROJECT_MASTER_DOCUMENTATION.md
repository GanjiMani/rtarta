# 📘 RTA Management System - The "End-to-End" Complete Project Documentation

This document is the **Comprehensive Master Guide** for the entire RTA (Registrar and Transfer Agent) Management System. It unifies the Frontend, Backend, Database, and Operational logic into a single reference manual.

---

## 1. 🌍 Project Overview

**RTA Prime Portal** is a full-stack web application designed to manage Mutual Fund investments. It allows investors to buy/sell funds, manage portfolios, and track transaction history, while providing a robust backend for secure financial processing.

### **Tech Stack**
*   **Frontend**: React (Vite), Tailwind CSS, Lucide Icons.
*   **Backend**: Python FastAPI, Pydantic, JWT Auth.
*   **Database**: PostgreSQL (via SQLAlchemy ORM).
*   **Architecture**: Monorepo with separated Client/Server logic.

---

## 2. 🖥️ Frontend Architecture (`/frontend`)

The user interface is a standardized Single Page Application (SPA).

### **A. Core Logic: Authentication**
*   **`AuthContext.jsx`**: The "Brain" of the frontend.
    *   **Login**: Sends credentials to API -> Receives JWT Token -> Saves to LocalStorage.
    *   **Session**: Checks for Token on load. If found, automatically logs user in.
    *   **Security**: Wraps *all* API calls in `fetchWithAuth()`, adding the `Authorization: Bearer <token>` header automatically.

### **B. Page Structure (Investor Portal)**
The app uses a consistent "Premium White Theme" layout:
1.  **`InvestorLayout.jsx`**: Wrapper component. Contains the fixed **Sidebar** and **Header**.
2.  **`Sidebar.jsx`**: Navigation menu (Dashboard, Purchase, SIP, Reports).
3.  **`Header.jsx`**: Top bar with Page Title, Search, and User Profile.

### **C. Key Functional Pages**
*   **`Dashboard.jsx`**: Landing page. Fetches `get_portfolio_summary` to show Total Value, Gain/Loss charts, and recent activity.
*   **`Purchase.jsx`**: Investment form. Inputs Amount & Scheme -> Calls `POST /purchase`.
*   **`Redemption.jsx`**: Withdrawal form. Inputs Units/Amount -> Calls `POST /redemption`.
*   **`ServiceRequests.jsx`**: Support module for address changes, etc.

---

## 3. ⚙️ Backend Architecture (`/backend`)

The server is a high-performance REST API built with FastAPI.

### **A. Application Entry (`main.py`)**
*   Initializes the `FastAPI` app.
*   Configures **CORS** (Cross-Origin Resource Sharing) to allow the React Frontend to connect.
*   Includes `Routers` for specific modules (Investor, Admin, AMC).

### **B. The Data Flow (The "Request Journey")**
Every request follows a strict path:
1.  **Router** (`routers/investor/transaction.py`): Receives HTTP Request.
2.  **Dependency** (`get_current_user`): Decodes JWT Token. If invalid -> 401 Error.
3.  **Schema** (`schemas/transaction.py`): Validates Input (e.g., "Is Amount > 0?").
4.  **Service** (`services/transaction_service.py`): Executes Business Logic (Calculations, Locks).
5.  **Model** (`models/*.py`): Maps logic to Database Tables.
6.  **Database**: SQL Operations (INSERT/UPDATE).

---

## 4. 🗃️ Database Schema (`models/`)

The system relies on 4 core relational tables:

1.  **`investor_master`** (`Investor`)
    *   **Identity**: `investor_id` (PK), `pan_number`, `email`.
    *   **Purpose**: Stores KYC, contact info, and links to all other data.

2.  **`folio_holdings`** (`Folio`)
    *   **Identity**: `folio_number` (PK).
    *   **Links**: `investor_id`, `scheme_id`.
    *   **Purpose**: Represents "The Account" for a specific fund. Stores `total_units` and `current_value`.

3.  **`transaction_history`** (`Transaction`)
    *   **Identity**: `transaction_id` (PK).
    *   **Fields**: `type` (Purchase/Redeem), `amount`, `units`, `nav`, `date`.
    *   **Purpose**: The immutable ledger of every financial action.

4.  **`sip_registrations`** (`SIPRegistration`)
    *   **Fields**: `frequency`, `amount`, `next_execution_date`.
    *   **Purpose**: Tracks recurring investment instructions.

---

## 5. 🧠 Business Logic Deep Dive

### **A. Buying Funds (`process_fresh_purchase`)**
*   **Goal**: User wants to invest ₹5,000.
*   **Logic**:
    1.  Check if Scheme is active.
    2.  Find or Create a `Folio` for this Investor + Scheme combo.
    3.  Get latest NAV (e.g., ₹100).
    4.  Calculate Units: `5000 / 100 = 50 Units`.
    5.  **Write Transaction**: Type="PURCHASE", Units=+50.
    6.  **Update Folio**: `total_units` += 50.

### **B. Selling Funds (`process_redemption`)**
*   **Goal**: User wants to withdraw ₹1,000.
*   **Logic**:
    1.  **Lock Folio**: Prevent race conditions.
    2.  Check Balance: Does User have enough units?
    3.  Calculate Units to sell: `1000 / 100 = 10 Units`.
    4.  **Write Transaction**: Type="REDEMPTION", Units=-10.
    5.  **Update Folio**: `total_units` -= 10.

### **C. Switching Funds (`process_switch`)**
*   **Goal**: Move ₹5,000 from Fund A to Fund B.
*   **Logic**:
    1.  **Step 1**: Run *Redemption* logic on Fund A (Sell Units).
    2.  **Step 2**: Run *Purchase* logic on Fund B (Buy Units) with the proceeds.
    3.  **Step 3**: Link the two Transaction IDs in the database.

---

## 6. 📊 Operational Workflows

### **Frontend-Backend Handshake**
1.  **On App Load**: Frontend calls `GET /profile/dashboard`.
2.  **Backend Response**:
    ```json
    {
      "portfolio": [{"scheme": "Fund A", "value": 5000}],
      "summary": {"total": 5000, "gain": 200}
    }
    ```
3.  **Frontend Action**: Renders the "Overview" cards and charts.

### **Security Model**
*   **Access Control**: Frontend cannot access Backend without a valid JWT.
*   **Role Based Access**: Admins get different tokens from Investors.
*   **Session**: If token expires, `AuthContext` catches the 401 error and redirects to Login.

---

*This document serves as the final, complete reference for the RTA Management System project structure and logic.*
