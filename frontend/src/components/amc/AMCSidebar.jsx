import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  FileText,
  RefreshCcw,
  UploadCloud, 
} from "lucide-react";
import { useAuth } from "../../services/AuthContext";

const menuItems = [
  { name: "Dashboard", path: "/amc", icon: LayoutDashboard },
  { name: "Fund Flows", path: "/amc/fund-flows", icon: TrendingUp },
  { name: "NAV Monitoring", path: "/amc/nav-monitoring", icon: BarChart2 },
  { name: "Compliance Reports", path: "/amc/compliance", icon: FileText },
  { name: "Reconciliation", path: "/amc/reconciliation", icon: RefreshCcw },
  { name: "NAVUpload", path: "/amc/nav-upload", icon: UploadCloud },
  { name: "Investor Profile", path: "/amc/investors", icon: () => <span>👤</span> },
  { name: "Transaction Reports", path: "/amc/transactions", icon: () => <span>📄</span> },
  { name: "Document Manager", path: "/amc/documents", icon: () => <span>📁</span> },
  { name: "Regulatory Disclosures", path: "/disclosures", icon: () => <span>📜</span> },

];

export default function AMCSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white shadow border-r z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:block`}
      >
        <nav className="flex flex-col h-full p-4">
          <div className="flex-grow mt-6 space-y-2">
            {menuItems.map(({ name, path, icon: Icon }) => (
              <NavLink
                to={path}
                key={name}
                end={path === "/amc"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                  }`
                }
              >
                {Icon ? <Icon size={18} /> : <span className="w-4" />}
                <span className="font-medium">{name}</span>
              </NavLink>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-100 hover:text-red-700 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
