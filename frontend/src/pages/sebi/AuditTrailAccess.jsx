// File: src/pages/sebi/AuditTrailAccess.jsx
import React, { useState } from "react";

const dummyAuditData = [
  {
    id: "T001",
    folio: "F001",
    transactionType: "Fresh Purchase",
    transactionDate: "2024-06-25",
    userId: "user_amc_01",
    amount: 10000,
    units: 40,
    status: "Completed",
  },
  {
    id: "T002",
    folio: "F001",
    transactionType: "Add Purchase",
    transactionDate: "2024-07-01",
    userId: "user_rta_02",
    amount: 5000,
    units: 19.2308,
    status: "Completed",
  },
  {
    id: "T005",
    folio: "F001",
    transactionType: "SWP",
    transactionDate: "2024-09-01",
    userId: "user_investor_01",
    amount: 500,
    units: 1.8587,
    status: "Completed",
  },
];

function downloadCSV(data) {
  const headers = [
    "Transaction ID",
    "Folio Number",
    "Transaction Type",
    "Transaction Date",
    "User ID",
    "Amount (₹)",
    "Units",
    "Status",
  ];

  const rows = data.map((record) => [
    record.id,
    record.folio,
    record.transactionType,
    record.transactionDate,
    record.userId,
    record.amount,
    record.units,
    record.status,
  ]);

  let csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "audit_trail_export.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function AuditTrailAccess() {
  const [filters, setFilters] = useState({
    folio: "",
    transactionId: "",
    userId: "",
    fromDate: "",
    toDate: "",
  });

  const [data] = useState(dummyAuditData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredData = data.filter((item) => {
    const matchFolio = filters.folio
      ? item.folio.toLowerCase().includes(filters.folio.toLowerCase())
      : true;
    const matchTxnId = filters.transactionId
      ? item.id.toLowerCase().includes(filters.transactionId.toLowerCase())
      : true;
    const matchUserId = filters.userId
      ? item.userId.toLowerCase().includes(filters.userId.toLowerCase())
      : true;
    const matchFromDate = filters.fromDate
      ? new Date(item.transactionDate) >= new Date(filters.fromDate)
      : true;
    const matchToDate = filters.toDate
      ? new Date(item.transactionDate) <= new Date(filters.toDate)
      : true;
    return matchFolio && matchTxnId && matchUserId && matchFromDate && matchToDate;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-red-700 mb-6">Audit Trail Access</h1>

      <div className="bg-white shadow rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          name="folio"
          placeholder="Filter by Folio Number"
          value={filters.folio}
          onChange={handleChange}
          className="border p-2 rounded"
          autoComplete="off"
        />
        <input
          type="text"
          name="transactionId"
          placeholder="Filter by Transaction ID"
          value={filters.transactionId}
          onChange={handleChange}
          className="border p-2 rounded"
          autoComplete="off"
        />
        <input
          type="text"
          name="userId"
          placeholder="Filter by User ID"
          value={filters.userId}
          onChange={handleChange}
          className="border p-2 rounded"
          autoComplete="off"
        />
        <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleChange}
          className="border p-2 rounded"
          aria-label="From Date"
        />
        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleChange}
          className="border p-2 rounded"
          aria-label="To Date"
        />
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full text-left border-collapse">
          <thead className="bg-red-100 text-red-700 font-semibold">
            <tr>
              <th className="p-3 border">Transaction ID</th>
              <th className="p-3 border">Folio Number</th>
              <th className="p-3 border">Transaction Type</th>
              <th className="p-3 border">Transaction Date</th>
              <th className="p-3 border">User ID</th>
              <th className="p-3 border">Amount (₹)</th>
              <th className="p-3 border">Units</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-red-50 cursor-default">
                  <td className="p-3 border">{record.id}</td>
                  <td className="p-3 border">{record.folio}</td>
                  <td className="p-3 border">{record.transactionType}</td>
                  <td className="p-3 border">{record.transactionDate}</td>
                  <td className="p-3 border">{record.userId}</td>
                  <td className="p-3 border">{record.amount}</td>
                  <td className="p-3 border">{record.units}</td>
                  <td className="p-3 border">{record.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="p-3 border text-center text-gray-500"
                >
                  No audit trail records found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => downloadCSV(filteredData)}
        className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition"
      >
        Export CSV
      </button>
    </div>
  );
}
