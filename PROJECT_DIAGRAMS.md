# 📊 RTA System Architecture & Logic Diagrams

This document contains "Mermaid" diagrams describing the logical flow of the Frontend and Backend, and how they interact.
*(Note: To view these diagrams graphically, use the Markdown Preview in VS Code or a Mermaid-compatible viewer).*

---

## 1. 🖥️ Frontend Architecture (Logic Flow)

The Frontend is a **State-Driven Single Page Application (SPA)**. The logic revolves centrally around the `AuthContext` which controls access and API communication.

```mermaid
graph TD
    %% Nodes
    Entry([main.jsx<br>Entry Point])
    App[App.jsx<br>Router Config]
    
    subgraph "Context Layer (Global State)"
        AuthCtx[AuthContext.jsx<br>Provider]
        State[(User State<br>& Token)]
        APIUtil[fetchWithAuth()<br>API Utility wrapper]
    end

    subgraph "Layout Layer"
        Layout[InvestorLayout.jsx]
        Sidebar[Sidebar Navigation]
        Header[Header & User Menu]
    end

    subgraph "Page Layer (Smart Components)"
        Login[Login.jsx]
        Dash[Dashboard.jsx]
        Inv[Investment Pages<br>Purchase/SIP]
        Svc[Service Pages<br>Complaints/Profile]
    end

    %% Flow Connections
    Entry --> App
    App --> AuthCtx
    AuthCtx -- "1. Init Check" --> State
    AuthCtx -- "2. Provide Context" --> Layout
    
    Layout --> Sidebar
    Layout --> Header
    Layout -- "Render Outlet" --> Dash
    Layout -- "Render Outlet" --> Inv
    Layout -- "Render Outlet" --> Svc

    %% Logic Logic
    Login -- "3. Login Action" --> AuthCtx
    AuthCtx -- "4. Set Token" --> State
    
    Dash -- "5. Data Request" --> APIUtil
    Inv -- "Data Request" --> APIUtil
    
    APIUtil -- "6. Attach Bearer Token" --> Req(Outgoing HTTP Request)
    
    style AuthCtx fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style APIUtil fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
```

### 🧠 Frontend Logic Breakdown
1.  **Initialization**: App starts, `AuthContext` checks `localStorage`. If a token exists, the user is "Logged In".
2.  **Routing Guard**: `App.jsx` checks the `user` state. If null, it forces the user to `Login.jsx`.
3.  **Layout Composition**: If authenticated, `InvestorLayout` wraps the content, ensuring the Sidebar and Header are always present.
4.  **Secure Requests**: Pages (like Dashboard) typically load data on mount (`useEffect`). They **do not** call `fetch` directly. They call `fetchWithAuth` from the Context. This function intercepts the request, adds the `Authorization: Bearer <token>` header, and handles 401 (Unauthorized) errors globally.

---

## 2. ⚙️ Backend Architecture (Logic Flow)

The Backend is a **Service-Oriented FastAPI Application**. Logic is separated into Routers (Controllers), Schemas (Validation), and Models (Database).

```mermaid
graph TD
    %% Nodes
    Req(Incoming HTTP Request)
    Main[main.py<br>FastAPI App]
    
    subgraph "Security Layer"
        CORS[CORS Middleware]
        AuthDeps[Auth Dependencies<br>get_current_user]
    end

    subgraph "Routing Layer (Controllers)"
        AuthRouter[routers/auth.py]
        InvRouter[routers/investor/*.py]
        AdminRouter[routers/admin/*.py]
    end

    subgraph "Data Layer"
        Schema[Pydantic Schemas<br>Input Validation]
        Models[SQLAlchemy Models<br>DB Structure]
        DB[(PostgreSQL DB)]
    end

    %% Flow Connections
    Req --> Main
    Main --> CORS
    CORS --> AuthDeps
    
    %% Logic Branching
    AuthDeps -- "1. Validate Token" --> InvRouter
    AuthDeps -- "1. Validate Token" --> AdminRouter
    
    %% Request Processing
    AuthRouter -- "Login Logic" --> DB
    
    InvRouter -- "2. Parse Input" --> Schema
    InvRouter -- "3. Business Logic" --> Models
    Models -- "4. SQL Query" --> DB
    
    DB -- "5. Raw Data" --> Models
    Models -- "6. Serialize" --> InvRouter
    InvRouter -- "7. JSON Response" --> Resp(HTTP Response)

    style AuthDeps fill:#ffccbc,stroke:#bf360c,stroke-width:2px
    style DB fill:#e0e0e0,stroke:#424242,stroke-width:2px
```

### 🧠 Backend Logic Breakdown
1.  **Entry & Middleware**: The request hits `main.py`. CORS logic runs first to allow requests from the Frontend URL.
2.  **Dependency Injection (Security)**: Before executing the core logic of a protected route (e.g., Dashboard), FastAPI executes `get_current_user`. This function decodes the JWT token. If invalid, it throws a 401 Error immediately.
3.  **Router/Controller**: The specific function for the endpoint runs (e.g., `get_dashboard_data`).
4.  **ORM Interaction**: The code doesn't write raw SQL. It interacts with Python classes (Models). SQLAlchemy converts `db.query(Portfolio).filter(...)` into SQL.

---

## 3. � End-to-End Interlinking (The Complete Cycle)

This sequence diagram shows exactly how a user action on the frontend triggers the entire chain across the stack.

**Scenario: User views the Dashboard**

```mermaid
sequenceDiagram
    participant User
    participant React as React Page (Dashboard.jsx)
    participant Auth as AuthContext (Frontend)
    participant API as FastApi (Backend)
    participant DB as Database

    Note over User, React: 1. Frontend Phase
    User->>React: Opens Dashboard Page
    React->>React: useEffect() triggers
    React->>Auth: fetchWithAuth("/api/investor/dashboard")
    Auth->>Auth: Get Token from LocalStorage
    Auth->>API: HTTP GET (Header: "Bearer eyJhbG...")

    Note over API, DB: 2. Backend Phase
    API->>API: Middleware (CORS check)
    API->>API: Dependency (Validate Token)
    alt Token Invalid
        API-->>Auth: 401 Unauthorized
        Auth->>User: Redirect to Login
    else Token Valid
        API->>DB: Query Portfolio & Transactions
        DB-->>API: Return Raw Records
        API->>API: Calculate Gains/Loss (Business Logic)
        API-->>Auth: JSON Response { "portfolio": [...], "summary": {...} }
    end

    Note over Auth, User: 3. Render Phase
    Auth-->>React: Return Data Object
    React->>React: Update State (setHoldings, setSummary)
    React->>User: Render Charts & Tables
```
