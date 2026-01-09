// File: src/layouts/SEBILayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SEBISidebar from "../components/sebi/SEBISidebar";
import SEBIHeader from "../components/sebi/SEBIHeader";
import { Menu } from "lucide-react";

export default function SEBILayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Responsive Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r shadow transform transition-transform z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:shadow-none`}
      >
        <SEBISidebar />
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col">
        {/* Header with hamburger */}
        <header className="flex items-center justify-between bg-white border-b shadow px-4 py-3 md:px-6">
          <button
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Title aligned left */}
          <h1 className="text-2xl font-semibold text-blue-700 ml-2 md:ml-0">
            SEBI Portal
          </h1>

          {/* Spacer pushes user controls to right edge */}
          <div className="flex-1" />

          {/* User info and logout aligned right */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 whitespace-nowrap">
              Welcome, {localStorage.getItem("userName") || "SEBI User"}
            </span>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/sebi/login";
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
              aria-label="Logout"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7"
                />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
