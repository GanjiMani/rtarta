import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import { User, LogOut, Settings, Bell, ChevronDown } from "lucide-react";

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get profile route based on user role
  const getProfileRoute = () => {
    if (!user) return "/login";
    if (user.role === "admin" || user.role === "RTA CEO") return "/admin/profile";
    if (user.role === "amc") return "/amc/profile";
    return "/profile";
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40 border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left section: menu toggle and branding */}
        <div className="flex items-center gap-4">
          {user && (
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <Link to={user ? (user.role === "admin" ? "/admin/admindashboard" : "/dashboard") : "/"}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RTA</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">RTA Portal</span>
            </div>
          </Link>
        </div>

        {/* Right section: user menu and actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notifications Button */}
              <Link to="/notifications">
                <button
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
              </Link>

              {/* User Name (visible on larger screens, after notification button) */}
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {user.name || user.email || "User"}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user.role || "Investor"}
                </div>
              </div>

              {/* User Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="User menu"
                >
                  {/* User Avatar */}
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {getUserInitials(user.name || user.email || "User")}
                  </div>

                  {/* Dropdown Arrow */}
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} 
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100">
                    {/* User Info in Dropdown (for mobile) */}
                    <div className="md:hidden px-4 py-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">
                        {user.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.email || ""}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 capitalize">
                        {user.role || "Investor"}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      to={getProfileRoute()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to={user.role === "admin" ? "/admin/settings" : "/profile/security"}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  aria-label="Investor Login"
                >
                  Login
                </button>
              </Link>
              <Link to="/login">
                <button 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                  aria-label="Get Started"
                >
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
