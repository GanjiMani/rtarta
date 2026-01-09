import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function SEBIHeader() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "SEBI Officer";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/sebi/login");
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-red-700 border-b shadow text-white">
      <h1 className="text-2xl font-semibold">SEBI Portal</h1>
      <div className="flex items-center space-x-4">
        <span>Welcome, {userName}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-200 hover:text-white"
          aria-label="Logout"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
}
