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
  ChevronRight,
  LogOut,
  UserCircle
} from "lucide-react";

const sections = [
  {
    title: "Intelligence",
    items: [
      { to: "/dashboard", label: "Operations Room", icon: LayoutDashboard },
      { to: "/transactions", label: "Ledger History", icon: RefreshCcw },
      { to: "/analytics/allocation", label: "Asset Strategy", icon: LineChart },
    ],
  },
  {
    title: "Capital Movement",
    items: [
      { to: "/purchase", label: "Deployment (Buy)", icon: Wallet },
      { to: "/redemption", label: "Liquidation (Sell)", icon: DollarSign },
      { to: "/sip", label: "SIP Protocols", icon: Repeat },
      { to: "/swp", label: "Withdrawal Plans", icon: Shuffle },
      { to: "/stp", label: "Transfer Protocols", icon: RefreshCcw },
      { to: "/switch", label: "Portfolio Switch", icon: Shuffle },
      { to: "/idcw", label: "Yield Prefs", icon: BadgeIndianRupee },
      { to: "/unclaimed", label: "Archived Assets", icon: FileArchive },
    ],
  },
  {
    title: "Statutory Reporting",
    items: [
      { to: "/reports/capital-gains", label: "Tax Disclosures", icon: FileBarChart },
      { to: "/reports/valuation", label: "Net Worth Audit", icon: FileSpreadsheet },
      { to: "/reports/cas", label: "Consolidated Statement", icon: FileText },
    ],
  },
  {
    title: "Identity & Trust",
    items: [
      { to: "/profile", label: "Identity File", icon: User },
      { to: "/profile/banks", label: "Financial Nodes", icon: CreditCard },
      { to: "/profile/nominees", label: "Succession Log", icon: Users },
      { to: "/settings", label: "Nexus Settings", icon: Shield },
      { to: "/profile/documents", label: "Vault Manager", icon: FileArchive },
    ],
  },
  {
    title: "Institutional Services",
    items: [
      { to: "/mandates", label: "Authority Mandates", icon: CreditCard },
      { to: "/service-requests", label: "Protocol Requests", icon: FileText },
      { to: "/notifications", label: "Secure Alerts", icon: Bell },
      { to: "/complaints", label: "Legal Recourse", icon: Shield },
      { to: "/support", label: "Help Desk", icon: HelpCircle },
      { to: "/disclosures", label: "Regulatory Portal", icon: FileArchive },
      { to: "/agents", label: "Advisor Network", icon: UserCircle },
    ],
  }
];

export default function Sidebar({ className = "" }) {
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!user) return null;

  return (
    <aside
      className={`w-72 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-[1px_0_20px_rgba(0,0,0,0.02)] overflow-hidden ${className}`}
    >
      {/* Top Header - Brand */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
            <span className="text-white font-black text-xs tracking-widest">RTA</span>
          </div>
          <div>
            <div className="text-sm font-black text-slate-800 tracking-widest uppercase opacity-90 group-hover:text-blue-600 transition-colors uppercase">PRIME PORTAL</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-[0.2em] italic uppercase">SECURE GATEWAY</div>
          </div>
        </div>
      </div>

      {/* Navigation - Main Body */}
      <nav className="flex-1 overflow-y-auto px-6 space-y-10 py-4 custom-scrollbar">
        {sections.map((section, si) => (
          <div key={si} className="space-y-4">
            <h5 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/20"></span>
              {section.title}
            </h5>
            <div className="space-y-1">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onMouseEnter={() => setHoveredItem(to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={({ isActive }) => `
                    group relative flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300
                    ${isActive
                      ? "bg-blue-50 text-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.08)] border-l-4 border-blue-600"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent"}
                  `}
                >
                  <Icon
                    size={20}
                    className={`transition-all duration-300 ${hoveredItem === to ? "scale-110" : ""}`}
                  />
                  <span className="text-sm font-bold tracking-tight flex-1">{label}</span>
                  <ChevronRight size={14} className={`opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-slate-300`} />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="p-6 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
              <UserCircle size={24} className="text-blue-600" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-black text-slate-900 truncate uppercase">{user.name?.split(' ')[0] || "OPERATOR"}</div>
              <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate">{user.role || "INVESTOR"}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
          >
            <LogOut size={16} />
            TERM. SESSION
          </button>
        </div>
        <div className="mt-4 text-[9px] text-slate-400 font-bold text-center uppercase tracking-[0.2em]">
          © 2026 PRIME PORTAL ARCHITECTURE
        </div>
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
