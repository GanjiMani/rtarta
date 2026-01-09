import React from "react";
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
  Settings,
  Bell,
  HelpCircle,
  Repeat,
  DollarSign,
  RefreshCcw,
  Shuffle,
  BadgeIndianRupee,
  FileSpreadsheet,
  FileBarChart,
  FileArchive,
} from "lucide-react";

const sections = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/transactions", label: "Transaction History", icon: RefreshCcw },
      { to: "/analytics/allocation", label: "Asset Allocation", icon: LineChart },
    ],
  },
  {
    title: "Investments",
    items: [
      { to: "/purchase", label: "Purchase", icon: Wallet },
      { to: "/redemption", label: "Redemption", icon: DollarSign },
      { to: "/sip", label: "SIP Setup", icon: Repeat },
      { to: "/swp", label: "SWP Setup", icon: Shuffle },
      { to: "/stp", label: "STP Setup", icon: RefreshCcw },
      { to: "/switch", label: "Switch", icon: Shuffle },
      { to: "/idcw", label: "IDCW Preferences", icon: BadgeIndianRupee },
      { to: "/unclaimed", label: "Unclaimed Amounts", icon: FileArchive },
    ],
  },
  {
    title: "Reports",
    items: [
      { to: "/reports/capital-gains", label: "Capital Gains", icon: FileBarChart },
      { to: "/reports/valuation", label: "Valuation Report", icon: FileSpreadsheet },
      { to: "/reports/cas", label: "CAS Download", icon: FileText },
    ],
  },
  {
    title: "Profile",
    items: [
      { to: "/profile", label: "Profile Overview", icon: User },
      { to: "/profile/banks", label: "Bank Mandates", icon: CreditCard },
      { to: "/profile/nominees", label: "Nominee Management", icon: Users },
      { to: "/profile/security", label: "Security Settings", icon: Shield },
      { to: "/profile/documents", label: "Document Manager", icon: FileArchive }, 
    ],
  },
  {
    title: "Services",
    items: [
      { to: "/mandates", label: "Mandate Management", icon: Settings },
      { to: "/service-requests", label: "Service Requests", icon: FileText },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/complaints", label: "Investor Complaints", icon: Shield },
      { to: "/support", label: "Support", icon: HelpCircle },
       { to: "/disclosures", label: "Regulatory Disclosures", icon: FileArchive }, 
      
    ],
  },
    {
      title: "Clients",
      items: [
        { to: "/clients", label: "My Agents", icon: Users },
      ],
    },

];

export default function Sidebar({ className = "" }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside
      className={`w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 h-screen sticky top-0 flex flex-col ${className}`}
    >
      {/* Sidebar Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">RTA</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Investor Portal</div>
            <div className="text-xs text-gray-500">Dashboard</div>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 scroll-smooth">
        <div className="flex flex-col gap-8">
          {sections.map((section, si) => (
            <div key={si}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </div>
              <div className="flex flex-col gap-1">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/dashboard" || to === "/profile"}
                    className={({ isActive }) => {
                      const baseClasses = "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative";
                      const activeClasses = isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900";
                      return `${baseClasses} ${activeClasses}`;
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          size={20} 
                          className={`transition-transform duration-200 ${
                            isActive
                              ? "text-white"
                              : "text-gray-500 group-hover:text-gray-700"
                          }`}
                        />
                        <span className="text-sm font-medium flex-1">{label}</span>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="px-4 py-4 border-t border-gray-200 bg-gray-50/50">
        <div className="px-3 py-2 text-xs text-gray-500">
          <div className="font-semibold text-gray-700 mb-1">Version 1.0.0</div>
          <div>© 2024 RTA Portal</div>
        </div>
      </div>
    </aside>
  );
}
