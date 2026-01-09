import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/investor/Sidebar";
import { useAuth } from "../services/AuthContext";

export default function InvestorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth(); // get login state

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar (only show if logged in) */}
      {user && (
        <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
          <Sidebar />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && user && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile Sidebar */}
      {user && (
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-md p-4 z-50 transform transition-transform duration-300 lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${user ? "lg:ml-64" : ""}`}>
        <Header toggleSidebar={toggleSidebar} />
        <main className="p-6 overflow-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
