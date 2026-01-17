import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  LineChart,
  FileText,
  User,
  CreditCard,
  Users,
  Shield,
  Bell,
  HelpCircle,
  Repeat,
  DollarSign,
  RefreshCw, // Changed from RefreshCcw to RefreshCw (more standard)
  Shuffle, // Usually safe, but can fallback to ArrowLeftRight if needed
  BarChart2, // Replacing FileBarChart
  Briefcase, // Replacing FileSpreadsheet/Archive
  LogOut,
  UserPlus // Replacing UserCircle
} from "lucide-react";

// Safe icon map to avoid import errors
const SafeIcons = {
  Dashboard: LayoutDashboard,
  History: RefreshCw,
  Chart: LineChart,
  Wallet: Wallet,
  Money: DollarSign,
  Repeat: Repeat,
  Switch: Shuffle,
  Profile: User,
  Bank: CreditCard,
  Users: Users,
  Shield: Shield,
  File: FileText,
  Bell: Bell,
  Help: HelpCircle,
  Briefcase: Briefcase,
  Report: BarChart2
};

const sections = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: SafeIcons.Dashboard },
      { to: "/transactions", label: "Transaction History", icon: SafeIcons.History },
      { to: "/analytics/allocation", label: "Asset Allocation", icon: SafeIcons.Chart },
    ],
  },
  {
    title: "Investments",
    items: [
      { to: "/purchase", label: "Purchase", icon: SafeIcons.Wallet },
      { to: "/redemption", label: "Redemption", icon: SafeIcons.Money },
      { to: "/sip", label: "SIP", icon: SafeIcons.Repeat },
      { to: "/swp", label: "SWP", icon: SafeIcons.Switch },
      { to: "/stp", label: "STP", icon: SafeIcons.Repeat },
      { to: "/switch", label: "Switch", icon: SafeIcons.Switch },
      { to: "/idcw", label: "IDCW Preferences", icon: SafeIcons.Wallet },
      { to: "/unclaimed", label: "Unclaimed Amounts", icon: SafeIcons.Briefcase },
    ],
  },
  {
    title: "Reports",
    items: [
      { to: "/reports/capital-gains", label: "Capital Gains", icon: SafeIcons.Report },
      { to: "/reports/valuation", label: "Valuation", icon: SafeIcons.File },
      { to: "/reports/cas", label: "CAS Statement", icon: SafeIcons.File },
    ],
  },
  {
    title: "Profile & Settings",
    items: [
      { to: "/profile", label: "Profile", icon: SafeIcons.Profile },
      { to: "/profile/banks", label: "Bank Accounts", icon: SafeIcons.Bank },
      { to: "/profile/nominees", label: "Nominees", icon: SafeIcons.Users },
      { to: "/profile/documents", label: "Documents", icon: SafeIcons.Briefcase },
      { to: "/settings", label: "Settings", icon: SafeIcons.Shield },
    ],
  },
  {
    title: "Services",
    items: [
      { to: "/mandates", label: "Mandates", icon: SafeIcons.Bank },
      { to: "/service-requests", label: "Service Requests", icon: SafeIcons.File },
      { to: "/notifications", label: "Notifications", icon: SafeIcons.Bell },
      { to: "/complaints", label: "Complaints", icon: SafeIcons.Shield },
      { to: "/support", label: "Support", icon: SafeIcons.Help },
      { to: "/disclosures", label: "Disclosures", icon: SafeIcons.Briefcase },
      { to: "/agents", label: "My Agents", icon: SafeIcons.Users },
    ],
  }
];

export default function Sidebar({ className = "" }) {
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Use a safe check for user
  if (!user) {
    return null;
  }

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex flex-col shadow-none overflow-hidden ${className}`}
    >
      {/* Top Header - Brand */}
      <div className="px-6 py-6 border-b border-gray-50 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs tracking-wider">RTA</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">RTA Portal</div>
            <div className="text-xs text-blue-600 font-medium">Investor</div>
          </div>
        </div>
      </div>

      {/* Navigation - Main Body */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-6 py-6 custom-scrollbar bg-white">
        {sections.map((section, si) => (
          <div key={si} className="space-y-1">
            <h5 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {section.title}
            </h5>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onMouseEnter={() => setHoveredItem(to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium
                    ${isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={isActive ? "text-blue-600" : "text-gray-400"}
                      />
                      <span className="flex-1 truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-gray-900 truncate">{user.name || "User"}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium text-xs hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </aside>
  );
}
