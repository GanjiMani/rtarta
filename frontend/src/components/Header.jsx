import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import {
  User,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
  Shield,
  Search,
  Zap,
  Menu,
  X,
  Activity,
  UserCheck
} from "lucide-react";

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length >= 2
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    if (!path || path === "dashboard") return "Operations Control";
    return path.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled
      ? "bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(37,99,235,0.03)] py-1"
      : "bg-white py-3"
      } border-b border-slate-100`}>
      <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between">

        {/* Left: Brand & Page Context */}
        <div className="flex items-center gap-4 lg:gap-10">
          <button
            className="lg:hidden p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
            onClick={toggleSidebar}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile Logo */}
          <Link to="/dashboard" className="lg:hidden">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-[10px] tracking-widest">RTA</span>
            </div>
          </Link>

          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-1">
              <Activity size={12} className="text-blue-500" />
              SYSTEM STATUS: <span className="text-emerald-500">OPTIMAL</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {getPageTitle()}
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            </h2>
          </div>
        </div>

        {/* Center: Global Command Search (Visual placeholder for now) */}
        <div className="hidden xl:flex flex-1 max-w-2xl mx-16 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Query system, find documents or execute protocols (⌘ + K)"
            className="w-full pl-16 pr-6 py-4 bg-slate-100/50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 transition-all placeholder:text-slate-400 outline-none"
          />
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              {/* Quick Action Toggle */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button className="p-2.5 rounded-xl bg-white shadow-sm text-slate-900 border border-slate-200/50 hover:shadow-md transition-all">
                  <Zap size={18} className="fill-amber-400 text-amber-500" />
                </button>
                <Link to="/notifications" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </Link>
              </div>

              {/* User Identity Segment */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-4 group"
                >
                  <div className="hidden lg:block text-right">
                    <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-wider">{user.name?.split(' ')[0] || "OPERATOR"}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">ID #{user.investor_id || "4921"}</div>
                  </div>

                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg group-hover:rotate-6 transition-transform duration-500">
                      <div className="h-full w-full bg-[#0F172A] rounded-[0.9rem] flex items-center justify-center text-white font-black text-xs">
                        {getUserInitials(user.name)}
                      </div>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white transition-colors ${dropdownOpen ? "bg-amber-400" : "bg-emerald-500"}`}></div>
                  </div>
                </button>

                {/* Dropdown Menu - Highly Redesigned */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-6 w-72 bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(15,23,42,0.15)] border border-slate-100 p-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-slate-50 p-6 rounded-[2rem] mb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                          <UserCheck size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 truncate max-w-[150px]">{user.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-3/4"></div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 text-right uppercase">Security Score: 75%</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link to="/profile" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-blue-600 font-bold text-sm transition-all group/item">
                        <div className="p-2.5 rounded-xl bg-slate-100 group-hover/item:bg-blue-100 transition-colors">
                          <User size={16} />
                        </div>
                        Identity Profile
                      </Link>
                      <Link to="/settings" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-blue-600 font-bold text-sm transition-all group/item">
                        <div className="p-2.5 rounded-xl bg-slate-100 group-hover/item:bg-blue-100 transition-colors">
                          <Shield size={16} />
                        </div>
                        Nexus Settings
                      </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-all"
                      >
                        Sign Out System
                        <LogOut size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-8 py-3.5 text-slate-600 font-black text-xs uppercase tracking-widest hover:text-blue-600 transition-colors">
                Terminal Access
              </Link>
              <Link to="/login" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                Join Network
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
