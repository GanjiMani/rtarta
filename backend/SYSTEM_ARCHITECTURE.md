# Backend System Architecture & Workflow

This document provides a diagrammatic overview of the Investor Backend System, illustrating how various modules interact, flow, and store data.

## 1. High-Level System Architecture

This diagram shows the overall pattern used across the application: **Router -> Service -> Model -> Database**.

```mermaid
graph TD
    Client[Frontend Client] -->|HTTP Request| Auth[Auth Middleware (JWT)]
    Auth -->|Valid Token| Router[FastAPI Router]
    
    subgraph "Controller Layer"
        Router -->|Validate Schema| Pydantic[Pydantic Schemas]
    end
    
    subgraph "Service Layer (Business Logic)"
        Router -->|Call Service| Service[Service Class]
        Service -->|Calculations/Validations| Service
    end
    
    subgraph "Data Access Layer"
        Service -->|ORM Query| Model[SQLAlchemy Model]
        Model -->|SQL| DB[(PostgreSQL/SQL Database)]
    end
    
    Service -->|Return DTO| Router
    Router -->|JSON Response| Client
```

---

## 2. Detailed Data Flow by Module

### A. Dashboard & Portfolio (1, 3, 13, 15)

**Modules:** Dashboard, Asset Allocation, Valuation, Profile.

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant P_Router as Profile Router
    participant I_Service as Investor Service
    participant DB as Database
    
    Note over FE, DB: 1. Dashboard & 3. Asset Allocation
    FE->>P_Router: GET /dashboard
    P_Router->>I_Service: get_investor_dashboard_data(investor_id)
    I_Service->>DB: Fetch Active Folios (Join Scheme)
    I_Service->>DB: Fetch Last 5 Transactions
    I_Service->>DB: Fetch Active SIPs
    
    loop For each Folio
        I_Service->>I_Service: Calculate Current Value (Units * Scheme NAV)
        I_Service->>I_Service: Group by Asset Class (Equity/Debt)
    end
    
    I_Service-->>P_Router: Return Portfolio Summary + Allocation
    P_Router-->>FE: JSON Response
```

### B. Transaction Processing (2, 4, 5, 9, 10)

**Modules:** History, Purchase, Redemption, Switch, IDCW.

```mermaid
flowchart TD
    subgraph "4. Purchase (Lumpsum)"
        StartPurchase([User Initiates Purchase]) --> ValidateScheme{Is Scheme Open?}
        ValidateScheme -- Yes --> CheckFolio{Folio Exists?}
        CheckFolio -- No --> CreateFolio[Create New Folio]
        CheckFolio -- Yes --> UpdateFolio[Select Folio]
        CreateFolio --> CreateTxn[Insert Transaction (Type: Purchase)]
        UpdateFolio --> CreateTxn
        CreateTxn --> UpdateHoldings[Update Folio: Units += New Units]
        UpdateHoldings --> EndPurchase([Complete])
    end

    subgraph "5. Redemption"
        StartRedeem([User Initiates Redemption]) --> LockFolio[Lock Folio Row (DB)]
        LockFolio --> CalcExit[Calculate Exit Load]
        CalcExit --> CreateRedeemTxn[Insert Transaction (Type: Redemption)]
        CreateRedeemTxn --> ReduceHoldings[Update Folio: Units -= Redeemed Units]
        ReduceHoldings --> EndRedeem([Complete])
    end

    subgraph "9. Switch"
        StartSwitch([User Switches A -> B]) --> Atomic{Atomic Txn}
        Atomic --> RedeemA[Redeem from Scheme A]
        RedeemA --> BuyB[Purchase in Scheme B]
        BuyB --> LinkTxnW[Link Txn IDs]
        LinkTxnW --> EndSwitch([Complete])
    end
```

### C. Systematic Plans (6, 7, 8, 20)

**Modules:** SIP, SWP, STP, Mandates.

```mermaid
sequenceDiagram
    participant User
    participant Txn_Router as Txn Router
    participant Txn_Service as Transaction Service
    participant M_Service as Mandate Service
    participant DB_Model as DB Tables

    Note over User, DB_Model: 6. SIP Setup Flow
    User->>Txn_Router: POST /sip (Scheme, Amount, Date)
    Txn_Router->>Txn_Service: setup_sip()
    
    rect rgb(240, 240, 240)
        Note right of Txn_Service: 20. Mandate Validation
        Txn_Service->>M_Service: check_mandate_validity(BankID, Amount)
        M_Service-->>Txn_Service: Valid / Invalid
    end
    
    alt Mandate Valid
        Txn_Service->>DB_Model: INSERT sip_registrations
        Txn_Service-->>User: SIP Registered (Active)
    else Mandate Invalid
        Txn_Service-->>User: Error: Mandate Not Ready
    end

    Note over DB_Model: Scheduled Job (Daily)
    DB_Model->>Txn_Service: process_sip_installment()
    Txn_Service->>DB_Model: INSERT transaction_history
    Txn_Service->>DB_Model: UPDATE folio_holdings
```

### D. Reports & Statements (12, 14, 11)

**Modules:** Capital Gains, CAS, Unclaimed.

```mermaid
graph LR
    subgraph "12. Capital Gains Logic"
        Input[Sell Transaction] --> FindBuy[Find Earliest Unmatched Buy (FIFO)]
        FindBuy --> Calc[Gap = Sell Date - Buy Date]
        Calc --> Classify{Gap > Threshold?}
        Classify -- "Yes (>1 Yr Equity)" --> LTCG[Long Term Gain]
        Classify -- "No" --> STCG[Short Term Gain]
    end

    subgraph "11. Unclaimed Amounts"
        BackOffice[Back Office Data] -->|Populate| UnclaimedTbl[Unclaimed Table]
        User[Investor] -->|Click Claim| API[Claim API]
        API -->|Update| Status[Status: Claimed]
        API -->|Init| BankTxn[Bank Transfer Process]
    end
```

### E. User Profile & Compliance (16-19, 21-25)

**Modules:** Banks, Nominees, Documents, Settings, Notifications, Complaints.

```mermaid
classDiagram
    class Investor {
        +String investor_id
        +String email
        +String pan
    }
    class BankAccount {
        +String account_no
        +Boolean is_verified
        +Boolean is_primary
        +Mandate mandate
    }
    class Nominee {
        +String name
        +Float allocation %
    }
    class Document {
        +String type
        +String status
    }
    class ServiceRequest {
        +String type
        +String status
    }
    class Complaint {
        +String category
        +String status
    }

    Investor "1" *-- "many" BankAccount : 16. Manage
    Investor "1" *-- "many" Nominee : 17. Allocate
    Investor "1" *-- "many" Document : 18. Upload
    Investor "1" -- "many" ServiceRequest : 21. Raise
    Investor "1" -- "many" Complaint : 23. Log
```

---

## 3. Database Schema Interlinking

This diagram highlights how the core tables connect to support the workflows above.

```mermaid
erDiagram
    INVESTOR_MASTER ||--o{ FOLIO_HOLDINGS : owns
    INVESTOR_MASTER ||--o{ BANK_ACCOUNTS : has
    INVESTOR_MASTER ||--o{ SERVICE_REQUESTS : raises
    
    FOLIO_HOLDINGS }|--|| SCHEME_MASTER : invests_in
    FOLIO_HOLDINGS ||--o{ TRANSACTION_HISTORY : records
    
    SIP_REGISTRATIONS }|--|| FOLIO_HOLDINGS : links_to
    SIP_REGISTRATIONS }|--|| BANK_ACCOUNTS : debits_from
    
    TRANSACTION_HISTORY }|--|| SCHEME_MASTER : references
    TRANSACTION_HISTORY }|--|| FOLIO_HOLDINGS : affects
    
    BANK_ACCOUNTS ||--o| MANDATE_DETAILS : contains
```

## 4. Module Workflows Summary

| Module | Primary Service | Data Source (Read) | Data Target (Write) |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `InvestorService` | `folio`, `scheme`, `txn` | N/A (Read Only) |
| **History** | `TransactionService` | `transaction_history` | N/A |
| **Purchase** | `TransactionService` | `scheme_master` | `folio`, `transaction` |
| **Redemption** | `TransactionService` | `folio` (units check) | `folio` (deduct), `transaction` |
| **SIP/SWP/STP** | `TransactionService` | `bank_accounts` (mandate) | `sip_registrations`, `transaction` |
| **Reports** | `ReportService` | `transaction`, `folio` | N/A |
| **Profile** | `InvestorService` | `investor_master` | `investor_master`, `bank`, `nominee` |
| **Support** | `SupportService` | `support_tickets` | `support_tickets` |

