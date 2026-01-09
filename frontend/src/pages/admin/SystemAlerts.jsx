import { useState } from "react";
import { AlertTriangle, Search, CheckCircle } from "lucide-react";

export default function SystemAlerts() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Dummy alerts (replace with API)
  const [alerts, setAlerts] = useState([
    { id: 1, type: "critical", msg: "Reconciliation failed for XYZ Fund (₹12.3 Cr mismatch).", resolved: false },
    { id: 2, type: "warning", msg: "3 IDCW payouts overdue beyond SEBI timeline.", resolved: false },
    { id: 3, type: "critical", msg: "Unauthorized login attempt detected (Admin ID: A102).", resolved: false },
    { id: 4, type: "warning", msg: "NAV upload pending for 2 schemes today.", resolved: false },
    { id: 5, type: "info", msg: "Scheduled backup completed successfully.", resolved: true },
  ]);

  const handleResolve = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  // Filtering
  const filteredAlerts = alerts.filter(a => {
    if (filter !== "all" && a.type !== filter) return false;
    if (search && !a.msg.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        System Alerts
      </h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Filter by severity */}
        <div className="flex gap-2">
          {["all", "critical", "warning", "info"].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                filter === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-md pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No alerts found.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        a.type === "critical"
                          ? "bg-red-100 text-red-700"
                          : a.type === "warning"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {a.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800">{a.msg}</td>
                  <td className="p-3">
                    {a.resolved ? (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle size={14} /> Resolved
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!a.resolved && (
                      <button
                        onClick={() => handleResolve(a.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
