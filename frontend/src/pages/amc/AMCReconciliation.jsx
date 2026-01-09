import React, { useState, useEffect } from "react";

const dummyReconciliationReports = [
  {
    id: 1,
    date: "2025-09-20",
    status: "Completed",
    totalTransactions: 1000,
    reconciled: 995,
    unreconciled: 5,
    description: "September daily reconciliation",
  },
  {
    id: 2,
    date: "2025-09-19",
    status: "Failed",
    totalTransactions: 1100,
    reconciled: 1080,
    unreconciled: 20,
    description: "September mid-month reconciliation",
  },
  {
    id: 3,
    date: "2025-09-18",
    status: "In Progress",
    totalTransactions: 1050,
    reconciled: 900,
    unreconciled: 150,
    description: "Automated reconciliation run",
  },
];

const statusClasses = {
  Completed: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
};

export default function AMCReconciliation() {
  const [reports, setReports] = useState(dummyReconciliationReports);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredReports = !filterStatus
    ? reports
    : reports.filter((r) => r.status === filterStatus);

  const startReconciliation = (report) => {
    setIsReconciling(true);
    setMessage(`Reconciliation started for report dated ${report.date}...`);
    setTimeout(() => {
      setIsReconciling(false);
      setMessage(`Reconciliation finished successfully for ${report.date}.`);
      // Optionally update report status or data here
    }, 3000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reconciliation</h1>
      <p className="mb-6 text-gray-600">
        This module helps reconcile fund transfers between AMC and RTA systems.
      </p>

      {message && (
        <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800">{message}</div>
      )}

      {/* Filter by Status */}
      <div className="mb-4">
        <label className="mr-2 font-semibold" htmlFor="statusFilter">
          Filter by Status:
        </label>
        <select
          id="statusFilter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="In Progress">In Progress</option>
        </select>
      </div>

      <ul className="space-y-3">
        {filteredReports.length === 0 && (
          <li className="text-center text-gray-500">No reports found.</li>
        )}
        {filteredReports.map((r) => (
          <li
            key={r.id}
            className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:justify-between md:items-center"
          >
            <div className="mb-2 md:mb-0">
              <h3 className="font-semibold text-lg">{r.description}</h3>
              <p className="text-sm text-gray-600">Date: {r.date}</p>
              <p className="text-sm text-gray-600">
                Total Transactions: {r.totalTransactions}
              </p>
              <p className="text-sm text-gray-600 flex space-x-4">
                <span>Reconciled: <strong>{r.reconciled}</strong></span>
                <span>Unreconciled: <strong>{r.unreconciled}</strong></span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  statusClasses[r.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {r.status}
              </span>

              <button
                onClick={() => alert(`Viewing detailed report ${r.description}`)}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                View Details
              </button>

              {r.status !== "In Progress" && (
                <button
                  disabled={isReconciling}
                  onClick={() => startReconciliation(r)}
                  className={`px-3 py-1 text-white rounded ${
                    isReconciling ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isReconciling ? "Reconciling..." : "Start Reconciliation"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
