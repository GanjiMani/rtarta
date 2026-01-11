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
      { to: "/profile/security", label: "Nexus Security", icon: Shield },
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
      className={`w-72 bg-[#0F172A] border-r border-slate-800/60 h-screen sticky top-0 flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.1)] overflow-hidden ${className}`}
    >
      {/* Top Header - Brand */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"></div>
            <span className="text-white font-black text-xs relative z-10 tracking-widest">RTA</span>
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-widest uppercase opacity-90 group-hover:text-blue-400 transition-colors">PRIME PORTAL</div>
            <div className="text-[10px] text-slate-500 font-bold tracking-[0.2em] italic">SECURE GATEWAY v1.4</div>
          </div>
        </div>
      </div>

      {/* Navigation - Main Body */}
      <nav className="flex-1 overflow-y-auto px-6 space-y-10 py-4 custom-scrollbar">
        {sections.map((section, si) => (
          <div key={si} className="space-y-4">
            <h5 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/30"></span>
              {section.title}
            </h5>
            <div className="space-y-1.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onMouseEnter={() => setHoveredItem(to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={({ isActive }) => `
                    group relative flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300
                    ${isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-transparent text-blue-400 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] border-l-4 border-blue-500"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-4 border-transparent"}
                  `}
                >
                  <Icon
                    size={20}
                    className={`transition-all duration-300 ${hoveredItem === to ? "scale-110 rotate-3" : ""}`}
                  />
                  <span className="text-sm font-bold tracking-wide flex-1">{label}</span>
                  <ChevronRight size={14} className={`opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-slate-600`} />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="p-6 mt-auto border-t border-slate-800/60 bg-[#0F172A]/80 backdrop-blur-md">
        <div className="bg-slate-800/40 p-5 rounded-[2rem] border border-slate-700/30">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600/50 flex items-center justify-center shadow-lg">
              <User size={24} className="text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-black text-white truncate">{user.name || "UNIDENTIFIED"}</div>
              <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase truncate">{user.role || "INVESTOR"}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-rose-500/10 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm"
          >
            <LogOut size={16} />
            TERM. SESSION
          </button>
        </div>
        <div className="mt-4 text-[9px] text-slate-600 font-bold text-center uppercase tracking-[0.2em]">
          © 2026 RTARTA DISRUPTOR SERIES
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </aside>
  );
}
