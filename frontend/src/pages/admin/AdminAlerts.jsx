import React, { useState, useEffect } from "react";
import { AlertTriangle, Shield } from "lucide-react";

// Dummy system alerts (replace with API later)
const dummyAlerts = [
  {
    id: 1,
    type: "critical",
    msg: "Reconciliation failed for XYZ Fund (₹12.3 Cr mismatch).",
    time: "2 min ago",
  },
  {
    id: 2,
    type: "warning",
    msg: "3 IDCW payouts overdue beyond SEBI timeline.",
    time: "15 min ago",
  },
  {
    id: 3,
    type: "critical",
    msg: "Unauthorized login attempt detected (Admin ID: A102).",
    time: "30 min ago",
  },
  {
    id: 4,
    type: "warning",
    msg: "NAV upload pending for 2 schemes today.",
    time: "1 hr ago",
  },
  {
    id: 5,
    type: "critical",
    msg: "Database replication lag detected (15 min delay).",
    time: "2 hr ago",
  },
];

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Simulate loading data from API
  useEffect(() => {
    const timer = setTimeout(() => {
      setAlerts(dummyAlerts);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter((a) => filterType === "All" || a.type === filterType)
    // Dummy "newest first" sort by time string length (replace with timestamps in real)
    .sort((a, b) => a.time.length - b.time.length);

  const handleAcknowledge = (id) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 max-w-3xl mx-auto" aria-label="System Alerts">
      {/* Header */}
      <h1 className="text-3xl font-bold text-blue-700 mb-2 flex items-center gap-2">
        <Shield className="w-7 h-7 text-blue-700" aria-hidden="true" />
        System Alerts
      </h1>
      <p className="text-gray-600 mb-6">
        Monitor operational alerts, exceptions, and security warnings.
      </p>

      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="alert-filter" className="font-semibold text-gray-700">
          Filter alerts:
        </label>
        <select
          id="alert-filter"
          className="border rounded px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filter alerts by type"
        >
          <option value="All">All</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {loading ? (
        <p role="status" aria-live="polite" className="text-center text-gray-600 py-20">
          Loading alerts...
        </p>
      ) : filteredAlerts.length === 0 ? (
        <p className="text-center text-gray-600 py-10">No alerts found for the selected filter.</p>
      ) : (
        <div aria-live="polite" aria-relevant="additions removals" className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl shadow flex justify-between items-start ${
                alert.type === "critical"
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
              role="alert"
              aria-atomic="true"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-6 h-6 mt-1 ${
                    alert.type === "critical" ? "text-red-600" : "text-yellow-600"
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p
                    className={`font-medium ${
                      alert.type === "critical" ? "text-red-700" : "text-yellow-700"
                    }`}
                  >
                    {alert.msg}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
              {acknowledgedIds.has(alert.id) ? (
                <span className="text-green-600 font-semibold">Acknowledged</span>
              ) : (
                <button
                  className="text-blue-600 text-sm hover:underline"
                  onClick={() => handleAcknowledge(alert.id)}
                  aria-label={`Acknowledge alert: ${alert.msg}`}
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
