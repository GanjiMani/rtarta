import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Menu,
  X,
  CheckCircle,
  FileText,
  BarChart3,
  Users,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Shield,
  RefreshCcw,
  LayoutDashboard,
  Settings,
  FileCheck,
  ClipboardList,
  ListChecks,
  Database,
  UserCheck,
  FileText as RegulatoryFiles,
  Briefcase
} from "lucide-react";

export default function AdminSidebar() {
  const { user } = useAuth();
  // If user object not fully populated from context yet, fallback to localstorage or defaults
  const role = user?.role;
  const sub_role = user?.sub_role || "executive"; // Default restricted view if undefined

  const [isOpen, setIsOpen] = useState(false);

  // Define Menu Items with Required Roles
  // If allowedRoles is missing, it's accessible to ALL authorized admins
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/admindashboard",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "senior_executive", "executive", "customer_service"]
    },
    {
      name: "Approvals",
      icon: CheckCircle,
      path: "/admin/approvals",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager"]
    },
    {
      name: "Transactions Monitor",
      icon: FileText,
      path: "/admin/transactions",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "senior_executive", "executive"]
    },
    {
      name: "NAV Upload",
      icon: BarChart3,
      path: "/admin/nav",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager"]
    },
    {
      name: "IDCW Management",
      icon: Layers,
      path: "/admin/idcw",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager"]
    },
    {
      name: "Unclaimed Funds",
      icon: RefreshCcw,
      path: "/admin/unclaimed",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "compliance_head"]
    },
    {
      name: "Reconciliation",
      icon: FileSpreadsheet,
      path: "/admin/recon",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "compliance_head"]
    },
    {
      name: "Exceptions",
      icon: AlertTriangle,
      path: "/admin/exceptions",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager"]
    },
    {
      name: "Reports",
      icon: FileText,
      path: "/admin/reports",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "compliance_head"]
    },
    {
      name: "Audit Logs",
      icon: Shield,
      path: "/admin/audit",
      allowedRoles: ["rta_ceo", "compliance_head"]
    },
    {
      name: "Monitoring Logs",
      icon: ClipboardList,
      path: "/admin/monitoring-logs",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager"]
    },
    {
      name: "User Role Management",
      icon: Users,
      path: "/admin/users",
      allowedRoles: ["rta_ceo"]
    },
    {
      name: "KYC Verification",
      icon: FileCheck,
      path: "/admin/kyc-verification",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "senior_executive"]
    },
    {
      name: "Complaints",
      icon: ClipboardList,
      path: "/admin/complaints",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "customer_service"]
    },
    {
      name: "Mandate Approvals",
      icon: ListChecks,
      path: "/admin/mandate-approvals",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager"]
    },
    {
      name: "System Settings",
      icon: Settings,
      path: "/admin/system-settings",
      allowedRoles: ["rta_ceo"]
    },
    {
      name: "Batch Jobs",
      icon: Database,
      path: "/admin/batch-jobs",
      allowedRoles: ["rta_ceo", "rta_coo"]
    },
    {
      name: "User Sessions",
      icon: UserCheck,
      path: "/admin/user-sessions",
      allowedRoles: ["rta_ceo", "compliance_head"]
    },
    {
      name: "Regulatory Filings",
      icon: RegulatoryFiles,
      path: "/admin/regulatory-filings",
      allowedRoles: ["rta_ceo", "compliance_head"]
    },
    {
      name: "Admin Alerts",
      icon: AlertTriangle,
      path: "/admin/admin-alerts",
      allowedRoles: ["rta_ceo", "rta_coo"]
    },
    {
      name: "System Alerts",
      icon: AlertTriangle,
      path: "/admin/alerts",
      allowedRoles: ["rta_ceo", "rta_coo"]
    },
    {
      name: "Document Manager",
      icon: FileText,
      path: "/admin/documents",
      allowedRoles: ["rta_ceo", "rta_coo", "operations_manager", "compliance_head"]
    },
    {
      name: "My Profile",
      icon: Briefcase,
      path: "/admin/profile"
    },
  ];

  // Filter Logic
  // Show item IF:
  // 1. It has NO allowedRoles defined (public to all admins)
  // 2. OR user's sub_role is in the allowed list
  // 3. OR user is 'rta_ceo' (Super Admin access implicitly)
  const filteredMenu = menuItems.filter(item => {
    if (!item.allowedRoles) return true;
    if (sub_role === "rta_ceo" || user?.email === "admin@rtasystem.com") return true;
    return item.allowedRoles.includes(sub_role);
  });

  const renderMenu = (menu, sectionTitle) => (
    <div className="mb-6">
      <h3 className="text-xs uppercase font-semibold text-gray-500 mb-3 ml-3">
        {sectionTitle}
      </h3>
      <div className="space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin/admindashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition mx-2 ${isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
              }`
            }
          >
            <item.icon size={18} />
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        className="md:hidden p-3 text-gray-700 fixed top-4 left-4 z-50 bg-white rounded-md shadow"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 overflow-y-auto ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:relative md:block`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">RTA Admin</h2>
              <p className="text-xs text-gray-500">{user?.full_name || "Official Portal"}</p>
            </div>
          </div>

          <nav aria-label="Admin Sidebar Navigation">
            {/* We can group these further if needed, for now flat filtered list */}
            {renderMenu(filteredMenu, "Operations & Management")}
          </nav>

          <div className="mt-8 px-5 py-4 bg-gray-50 rounded-xl border border-gray-100 mx-2">
            <p className="text-xs text-gray-400 font-medium uppercase mb-1">Current Role</p>
            <p className="text-sm font-bold text-gray-800 capitalize">{(sub_role || "Admin").replace("_", " ")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
