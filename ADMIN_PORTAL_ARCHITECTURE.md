 # Admin Portal Architecture & Implementation Plan

## Overview
This document outlines the architecture for the **RTA Admin Portal**, focusing on Role-Based Access Control (RBAC), secure data handling, and a modular UI/UX. The goal is to separate concerns between different RTA user levels (CEO, Operations, Compliance) and External AMC officials.

---

## 1. Role-Based Access Control (RBAC) System

The system requires strictly defined roles with specific access levels. We will implement this using a **Permission-Based** approach rather than just simple Role-Based, allowing for greater flexibility.

### 1.1 Role Hierarchy & Permissions
We will map the documented roles to specific granular permissions.

| Role | Access Level | Permissions |
|------|--------------|-------------|
| **RTA CEO** | Full Control | `read:all`, `write:all`, `admin:users`, `system:config`, `emergency:override` |
| **RTA COO** | Read-Write | `read:all`, `write:transactions`, `write:operations`, `approve:bulk` |
| **Compliance Head** | Compliance | `read:audit`, `read:transactions`, `write:regulatory_reports`, `approve:compliance` |
| **Ops Manager** | Operations | `read:operations`, `write:transactions`, `approve:level1` |
| **Senior Exec** | Execution | `read:folio`, `write:purchase`, `write:redemption`, `read:nav` |
| **Executive** | Basic | `read:folio`, `write:entry` (Draft only) |
| **AMC Official** | Restricted | `read:amc_{amc_id}`, `read:reports` |

### 1.2 Backend Model Updates
The `User` model currently has a basic `UserRole` enum. We will enhance this to support granular permissions.

**Approach**:
1.  **Keep `UserRole`** for high-level separation (Admin, Investor, AMC).
2.  **Add `sub_role` column** to `users` table (e.g., 'ceo', 'ops_manager', 'executive') for Admins.
3.  **Add `permissions` column** (JSON) to `users` table for custom overrides, OR use a hardcoded `ROLE_PERMISSIONS` mapping in the code to ensure consistency.
    *   *Decision*: Use Hardcoded Mapping in `app/core/security.py` for easier auditability and maintenance.

### 1.3 Backend Security Implementation
All Admin API endpoints will use a new dependency `get_current_admin_user` which accepts a required permission list.

```python
# app/core/permissions.py
ADMIN_PERMISSIONS = {
    "ceo": ["view_dashboard", "manage_users", "approve_critical", ...],
    "executive": ["view_dashboard", "create_transaction"],
    # ...
}

def check_permission(permission: str, user: User):
    if user.role != UserRole.admin: return False
    allowed = ADMIN_PERMISSIONS.get(user.sub_role, [])
    return permission in allowed
```

---

## 2. Frontend Architecture (React + Vite)

### 2.1 Admin Directory Structure
We will organize the admin logic within `frontend/src` but keep it distinct.

```
frontend/src/
├── components/
│   └── admin/
│       ├── AccessControl.jsx       # HOC for permission checking
│       ├── AdminSidebar.jsx        # Dynamic sidebar based on roles
│       ├── AdminHeader.jsx
│       └── DashboardWidgets/
├── pages/
│   └── admin/
│       ├── Dashboard.jsx
│       ├── UserManagement.jsx
│       ├── TransactionApprovals.jsx # (Ops/CEO only)
│       └── Reports.jsx
└── layouts/
    └── AdminLayout.jsx             # Handles Auth check & Sidebar injection
```

### 2.2 Access Control Component (`AccessControl`)
A wrapper component to conditionally render elements based on the logged-in user's role/permissions.

```jsx
// Usage Example
<AccessControl requiredPermission="approve_transactions">
  <Button onClick={approveTransaction}>Approve</Button>
</AccessControl>
```

### 2.3 Dynamic Sidebar
The `AdminSidebar` will filter navigation items based on the user's permissions.
*   **CEO**: Sees "System Settings", "User Management".
*   **Executive**: Sees only "Transactions", "Search".

---

## 3. Implementation Phases

### Phase 1: Backend Core (RBAC)
1.  **Update `User` Model**: Add `sub_role` field.
2.  **Define Permissions**: Create `backend/app/core/roles.py` with standard role definitions.
3.  **Secure Endpoints**: Update `backend/app/routers/admin/*.py` to replace generic `role=="admin"` checks with specific permission checks (e.g., `Depends(has_permission("approve_transaction"))`).

### Phase 2: Frontend Foundation
1.  **Auth State**: Ensure global state (Redux/Context) stores the `sub_role` and `permissions` upon login.
2.  **AdminLayout**: Integrate permission checking to redirect unauthorized users.
3.  **Sidebar**: Make it dynamic.

### Phase 3: Core Features (Role-Specific)
1.  **Dashboard**: Create different widgets (High-level stats for CEO, Task queue for Exec).
2.  **Approvals**: Build the "Pending Transactions" view, visible only to Approvers (Managers+).
3.  **Audit Logs**: Visible only to Compliance/CEO.

### Phase 4: AMC Portal (External Admin)
1.  **AMC Layout**: Reuse components but restricted data scope.
2.  **Data Scoping**: Ensure AMC users *only* see data where `folio.amc_id == user.amc_id`.

---

## 4. Key Considerations from Documentation
-   **Dual Authorization**: High-value transactions (defined in docs) need a "Maker-Checker" flow.
    *   *Impl*: `Transaction` status `pending_approval`. `Executive` creates (Maker), `Manager` approves (Checker).
-   **Unclaimed Funds**: Special ledger and aging report.
-   **Audit Trails**: Every action must be logged in `AuditLog`.

This plan ensures we meet the strict "Least Privilege" and security requirements of the RTA framework while providing a usable, modern interface.
