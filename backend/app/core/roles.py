from typing import Dict, List

# Define granular permissions
class AdminPermissions:
    # Read Access
    READ_ALL = "read:all"
    READ_TRANSACTIONS = "read:transactions"
    READ_OPERATIONS = "read:operations"
    READ_FOLIO = "read:folio"
    READ_NAV = "read:nav"
    READ_AUDIT = "read:audit"
    READ_REPORTS = "read:reports"
    VIEW_DASHBOARD = "view:dashboard"
    
    # Write Access
    WRITE_ALL = "write:all"
    WRITE_TRANSACTIONS = "write:transactions"
    WRITE_OPERATIONS = "write:operations"
    WRITE_PURCHASE = "write:purchase"
    WRITE_REDEMPTION = "write:redemption"
    WRITE_ENTRY = "write:entry" # Draft only
    WRITE_REGULATORY_REPORTS = "write:regulatory_reports"
    
    # Administrative
    ADMIN_USERS = "admin:users"
    SYSTEM_CONFIG = "system:config"
    EMERGENCY_OVERRIDE = "emergency:override"
    
    # Approvals
    APPROVE_BULK = "approve:bulk"
    APPROVE_COMPLIANCE = "approve:compliance"
    APPROVE_LEVEL1 = "approve:level1"

# Map roles to their default permissions
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "rta_ceo": [
        AdminPermissions.READ_ALL,
        AdminPermissions.WRITE_ALL,
        AdminPermissions.ADMIN_USERS,
        AdminPermissions.SYSTEM_CONFIG,
        AdminPermissions.EMERGENCY_OVERRIDE,
        AdminPermissions.VIEW_DASHBOARD,
        AdminPermissions.APPROVE_LEVEL1  # Implicitly can approve
    ],
    "rta_coo": [
        AdminPermissions.READ_ALL,
        AdminPermissions.WRITE_TRANSACTIONS,
        AdminPermissions.WRITE_OPERATIONS,
        AdminPermissions.APPROVE_BULK,
        AdminPermissions.VIEW_DASHBOARD,
        AdminPermissions.APPROVE_LEVEL1  # Implicitly can approve
    ],
    "compliance_head": [
        AdminPermissions.READ_AUDIT,
        AdminPermissions.READ_TRANSACTIONS,
        AdminPermissions.WRITE_REGULATORY_REPORTS,
        AdminPermissions.APPROVE_COMPLIANCE,
        AdminPermissions.READ_REPORTS,
        AdminPermissions.VIEW_DASHBOARD
    ],
    "operations_manager": [
        AdminPermissions.READ_OPERATIONS,
        AdminPermissions.WRITE_TRANSACTIONS,
        AdminPermissions.APPROVE_LEVEL1,
        AdminPermissions.READ_FOLIO,
        AdminPermissions.VIEW_DASHBOARD
    ],
    "senior_executive": [
        AdminPermissions.READ_FOLIO,
        AdminPermissions.WRITE_PURCHASE,
        AdminPermissions.WRITE_REDEMPTION,
        AdminPermissions.READ_NAV,
        AdminPermissions.VIEW_DASHBOARD
    ],
    "executive": [
        AdminPermissions.READ_FOLIO,
        AdminPermissions.WRITE_ENTRY, # Draft only
        AdminPermissions.VIEW_DASHBOARD
    ],
    "customer_service": [
        AdminPermissions.READ_FOLIO,
        AdminPermissions.READ_TRANSACTIONS,
        AdminPermissions.VIEW_DASHBOARD
    ]
}
