import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  BarChart2,
  Eye,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/sebi", icon: LayoutDashboard },
  { name: "Compliance Monitoring", path: "/sebi/compliance-monitoring", icon: ClipboardList },
  { name: "Regulatory Reports", path: "/sebi/regulatory-reports", icon: FileText },
  { name: "Audit Trail", path: "/sebi/audit-trail", icon: Eye },
  { name: "Unclaimed Oversight", path: "/sebi/unclaimed-oversight", icon: BarChart2 },
  { name: "Transaction Reports", path: "/sebi/transaction-reports", icon: FileText }, 
  { name: "Folio Account Details", path: "/sebi/folio-details", icon: ClipboardList }, 
];

export default function SEBISidebar() {
  return (
    <aside className="w-64 bg-white shadow border-r flex flex-col p-4 min-h-screen">
      <nav className="flex flex-col space-y-2 mt-6">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            end={path === "/sebi"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-red-700 text-white"
                  : "text-gray-700 hover:bg-red-100 hover:text-red-700"
              }`
            }
          >
            {Icon ? <Icon /> : <span className="w-4" />}
            <span className="font-medium">{name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
