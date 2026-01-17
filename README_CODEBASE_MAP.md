# RTA Management System - Codebase Map & Documentation

This document provides a comprehensive map of the RTA (Registrar and Transfer Agent) Management System codebase. It details the file structure, functionality of key components, and how the frontend and backend interact, without modifying any existing code.

## 🏗️ Project Architecture

The project is built using a **Monorepo-style structure** with two main directories:
*   **`backend/`**: Python FastAPI application handling business logic, database interactions, and APIs.
*   **`frontend/`**: React (Vite) application handling the user interface and client-side logic.

---

## 🖥️ Frontend (`/frontend`)

The frontend is a React application powered by Vite. It uses Tailwind CSS for styling and `react-router-dom` for navigation.

### 📂 Key Directory Structure

| Directory/File | Description | Functionality & Links |
| :--- | :--- | :--- |
| **`src/main.jsx`** | Application Entry Point | Mounts the React app to the DOM `root`. |
| **`src/App.jsx`** | Main Router | Defines all application routes (URLs) and links them to specific Page components. |
| **`src/services/AuthContext.jsx`** | Authentication State | **Critical Link:** Manages User state (`user`, `token`) and provides `fetchWithAuth` wrapper function handling API calls with Bearer tokens to the Backend. |
| **`src/layouts/`** | Layout Wrappers | Contains `InvestorLayout.jsx` which wraps all dashboard pages with the `Sidebar` and `Header`. |
| **`src/components/`** | Reusable UI | Contains shared components like `Sidebar.jsx`, `Header.jsx`, and UI elements. |
| **`src/pages/investor/`** | Investor Pages | Contains all screen views for the Investor Portal. |

### 📄 Detailed Page Functionality Map

#### 1. Core Pages
*   **`Login.jsx` / `Register.jsx`**:
    *   **Functionality**: User authentication.
    *   **Backend Link**: Calls `POST /api/investor/auth/login` and `POST /api/investor/auth/register`.
*   **`Dashboard.jsx`**:
    *   **Functionality**: Overview of portfolio, recent transactions, and summary stats.
    *   **Backend Link**: Calls `GET /api/investor/profile/dashboard`.

#### 2. Investment Operations
*   **`Purchase.jsx`**: Form to buy new mutual fund units. Links to `POST /api/investor/transaction/purchase`.
*   **`Redemption.jsx`**: Form to sell/redeem units. Links to `POST /api/investor/transaction/redeem`.
*   **`SIPSetup.jsx`**: Configure Systematic Investment Plans. Links to `POST /api/investor/sip`.
*   **`SWPSetup.jsx`** / **`STPSetup.jsx`** / **`SwitchSetup.jsx`**: Manage systematically withdrawal/transfer plans.

#### 3. Reports & Statements
*   **`TransactionHistory.jsx`**: Lists past financial activities. Links to `GET /api/investor/transactions`.
*   **`CapitalGainsReport.jsx`**: Calculates and displays tax-related gains/losses.
*   **`CASDownload.jsx`**: Generates Consolidated Account Statements (CAS).
*   **`ValuationReport.jsx`**: Current portfolio valuation report.

#### 4. Services & Support
*   **`ServiceRequests.jsx`**: Raise tickets for address change, mobile update, etc.
*   **`InvestorComplaints.jsx`**: Lodge formal grievances.
*   **`Support.jsx`**: Help desk ticketing system.
*   **`Notifications.jsx`**: View system alerts and updates.
*   **`RegulatoryDisclosure.jsx`**: View compliance notices (`GET /api/investor/disclosures`).

---

## ⚙️ Backend (`/backend`)

The backend is a **FastAPI** application using **SQLAlchemy** for ORM and **Pydantic** for data validation.

### 📂 Key Directory Structure

| Directory/File | Description | Functionality & Links |
| :--- | :--- | :--- |
| **`app/main.py`** | Application Entry Point | **Critical Link:** Initializes `FastAPI` app, configures CORS (allowing frontend access), and includes all Routers (API endpoints). |
| **`app/db/`** | Database Module | Handles DB connection (`session.py`) and Base models (`base.py`). |
| **`app/models/`** | Database Models | Defines SQL tables (e.g., `User`, `Portfolio`, `Transaction`). |
| **`app/schemas/`** | Pydantic Schemas | input/Output data validation models (ensures frontend sends correct JSON). |
| **`app/routers/`** | API Routes | Contains the actual endpoint logic, grouped by role (Investor, Admin, AMC). |

### 🔌 API Module Map (`app/routers/`)

The backend is organized by "User Role" modules:

#### 1. Investor Module (`app/routers/investor/`)
*   **`auth.py`**: Handles Login/Register logic. Generates JWT tokens used by `AuthContext.jsx`.
*   **`profile.py`**: Fetches user details, dashboard data, and bank accounts.
*   **`transaction.py`**: Handles Purchase, Redeem, and Switch logic. Writes to `Transaction` table.
*   **`sip.py` / `swp.py`**: Manages standing instructions for periodic investments/withdrawals.
*   **`reports.py`**: Generates logic for CAS, Capital Gains, and Valuation reports.

#### 2. Admin Module (`app/routers/admin/`)
*   **`dashboard.py`**: Admin-specific aggregate stats.
*   **`user_management.py`**: Logic to list, approve, or block users.
*   **`approvals.py`**: Workflow for approving high-value transactions or KYC requests.

---

## 🔗 How They Connect (The "Linkage")

1.  **Request Flow**:
    *   **User Action**: User clicks "Login" on frontend `Login.jsx`.
    *   **Frontend Service**: `AuthContext.jsx` -> `login()` function sends a `POST` request to `http://localhost:8000/api/investor/auth/login`.
    *   **Backend Routing**: `app/main.py` routes request -> `app/routers/investor/auth.py`.
    *   **Database**: Backend queries `app/models/user.py` via `app/db/session` to verify credentials.
    *   **Response**: Backend returns a **JWT Token**.
    *   **State Update**: Frontend stores Token in `localStorage` and updates `user` state.

2.  **Data Fetching Flow**:
    *   **User Action**: User opens "Dashboard".
    *   **Frontend Effect**: `Dashboard.jsx` calls `fetchWithAuth('/api/investor/profile/dashboard')`.
    *   **Authentication**: `fetchWithAuth` automatically adds `Authorization: Bearer <token>` header.
    *   **Backend Validation**: FastAPI dependency validates the token.
    *   **Logic**: `app/routers/investor/profile.py` calculates portfolio value from `app/models/portfolio.py`.
    *   **Display**: Frontend receives JSON data and renders charts/tables.

---

*This file was generated to provide a clear, high-level overview of the system architecture without modifying existing application logic.*
