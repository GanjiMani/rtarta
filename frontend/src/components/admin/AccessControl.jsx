import React from 'react';
import { useAuth } from '../../services/AuthContext';

// Permission Map (Should match Backend ideally)
const ROLE_PERMISSIONS = {
    "rta_ceo": ["all"],
    "rta_coo": ["all"],
    "compliance_head": ["view_audit", "view_reports", "approve_compliance"],
    "operations_manager": ["view_dashboard", "manage_transactions", "approve_level1", "view_users"],
    "senior_executive": ["view_dashboard", "create_transaction", "view_users_read"],
    "executive": ["view_dashboard", "create_transaction"],
    "customer_service": ["view_dashboard", "view_users_read"]
};

export default function AccessControl({ requiredPermission, children, fallback = null }) {
    const { user } = useAuth();

    if (!user || user.role !== 'admin') return fallback;

    // Super Admin override
    if (user.email === 'admin@rtasystem.com') return children;

    const userSubRole = user.sub_role || ""; // e.g. "operations_manager"
    const userPermissions = ROLE_PERMISSIONS[userSubRole] || [];

    const hasAccess = userPermissions.includes("all") || userPermissions.includes(requiredPermission);

    return hasAccess ? children : fallback;
}
