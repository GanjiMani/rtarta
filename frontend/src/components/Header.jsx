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
    if (!path || path === "dashboard") return "Dashboard";
    return path.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
      ? "bg-white shadow-md py-2"
      : "bg-white py-3"
      } border-b border-gray-100`}>
      <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between">

        {/* Left: Brand & Page Context */}
        <div className="flex items-center gap-4 lg:gap-10">
          <button
            className="lg:hidden p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            onClick={toggleSidebar}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile Logo */}
          <Link to="/dashboard" className="lg:hidden">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-[10px] tracking-widest">RTA</span>
            </div>
          </Link>

          <div className="hidden md:flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Center: Search (Placeholder) */}
        <div className="hidden xl:flex flex-1 max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-lg text-sm text-gray-700 transition-all outline-none"
          />
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notifications */}
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/notifications" className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Link>
              </div>

              {/* User Identity Segment */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 group"
                >
                  <div className="hidden lg:block text-right">
                    <div className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">{user.name || "User"}</div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{user.role || "Investor"}</div>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-sm transition-transform group-hover:scale-105">
                    <User size={20} />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 mb-2">
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 uppercase">{user.role}</p>
                    </div>

                    <div className="space-y-1">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 text-sm transition-colors">
                        <User size={16} />
                        Profile
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 text-sm transition-colors">
                        <Settings size={16} />
                        Settings
                      </Link>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 text-gray-600 font-bold text-xs uppercase hover:text-blue-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-lg shadow-md transition-all">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
