import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import Header from "../components/Header";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      {/* flex-1 with minWidth:0 for shrinking */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        <Header />
        <main className="p-6 flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
