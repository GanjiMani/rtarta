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
} from "lucide-react";

export default function AdminSidebar() {
  const { user } = useAuth();
  const role = user?.role || localStorage.getItem("role");
  const [isOpen, setIsOpen] = useState(false);

  const rtaMenu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/admindashboard" },
    { name: "Approvals", icon: CheckCircle, path: "/admin/approvals" },
    { name: "Transactions Monitor", icon: FileText, path: "/admin/transactions" },
    { name: "NAV Upload", icon: BarChart3, path: "/admin/nav" },
    { name: "IDCW Management", icon: Layers, path: "/admin/idcw" },
    { name: "Unclaimed Funds", icon: RefreshCcw, path: "/admin/unclaimed" },
    { name: "Reconciliation", icon: FileSpreadsheet, path: "/admin/recon" },
    { name: "Exceptions", icon: AlertTriangle, path: "/admin/exceptions" },
    { name: "Reports", icon: FileText, path: "/admin/reports" },
    { name: "Audit Logs", icon: Shield, path: "/admin/audit" },
    { name: "Monitoring Logs", icon: ClipboardList, path: "/admin/monitoring-logs" },
    { name: "User Role Management", icon: Users, path: "/admin/users" },
    { name: "KYC Verification", icon: FileCheck, path: "/admin/kyc-verification" },
    { name: "Complaints", icon: ClipboardList, path: "/admin/complaints" },
    { name: "Mandate Approvals", icon: ListChecks, path: "/admin/mandate-approvals" },
    { name: "System Settings", icon: Settings, path: "/admin/system-settings" },
    { name: "Batch Jobs", icon: Database, path: "/admin/batch-jobs" },
    { name: "User Sessions", icon: UserCheck, path: "/admin/user-sessions" },
    { name: "Regulatory Filings", icon: RegulatoryFiles, path: "/admin/regulatory-filings" },
    { name: "Admin Alerts", icon: AlertTriangle, path: "/admin/admin-alerts" },
    { name: "System Alerts", icon: AlertTriangle, path: "/admin/alerts" },
    { name: "Document Manager", icon: FileText, path: "/admin/documents" },
    { name: "Maintenance", icon: Settings, path: "/admin/maintenance" },
  ];

const adminRoles = ["admin", "RTA CEO", "superadmin"]; // add all admin roles you want to allow
const showRTA = adminRoles.includes(role);

  const renderMenu = (menu, sectionTitle) => (
    <div className="mb-6">
      <h3 className="text-xs uppercase font-semibold text-gray-500 mb-3">
        {sectionTitle}
      </h3>
      <div className="space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin"}  // Only dashboard uses exact matching
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
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
      {/* Hamburger button for mobile */}
      <button
        className="md:hidden p-3 text-gray-700 fixed top-4 left-4 z-50 bg-white rounded-md shadow"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop overlay for mobile sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white shadow-md z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:block`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-blue-700">RTA Admin</h2>
          <nav aria-label="Admin Sidebar Navigation">
            {showRTA && renderMenu(rtaMenu, "RTA Operations")}
          </nav>
        </div>
      </aside>
    </>
  );
}
