// File: src/pages/distributor/CommissionReports.jsx
import React, { useState } from "react";

const dummyCommissions = [
  {
    month: "2025-09",
    scheme: "Visionary Bluechip Fund",
    pending: 5000,
    paid: 20000,
  },
  {
    month: "2025-08",
    scheme: "Progressive Debt Fund",
    pending: 3000,
    paid: 15000,
  },
  {
    month: "2025-07",
    scheme: "Horizon Balanced Fund",
    pending: 0,
    paid: 10000,
  },
];

export default function CommissionReports() {
  const [filters, setFilters] = useState({
    fromMonth: "",
    toMonth: "",
    scheme: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Filter data based on filters
  const filteredData = dummyCommissions.filter(({ month, scheme }) => {
    const matchScheme = filters.scheme
      ? scheme.toLowerCase().includes(filters.scheme.toLowerCase())
      : true;
    const matchFromMonth = filters.fromMonth ? month >= filters.fromMonth : true;
    const matchToMonth = filters.toMonth ? month <= filters.toMonth : true;
    return matchScheme && matchFromMonth && matchToMonth;
  });

  // Generate CSV content for export
  const exportCSV = () => {
    const headers = ["Month", "Scheme", "Pending Commission", "Paid Commission"];
    const rows = filteredData.map((d) => [
      d.month,
      d.scheme,
      d.pending,
      d.paid,
    ]);
    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "commission_ledger.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // PDF export placeholder
  const exportPDF = () => {
    alert("PDF export functionality to be implemented.");
  };

  // Calculate totals
  const totalPending = filteredData.reduce((sum, d) => sum + d.pending, 0);
  const totalPaid = filteredData.reduce((sum, d) => sum + d.paid, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-semibold text-blue-700 mb-6">Commission Reports</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col">
          <label htmlFor="fromMonth" className="font-medium mb-1">
            From Month
          </label>
          <input
            type="month"
            id="fromMonth"
            name="fromMonth"
            value={filters.fromMonth}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="toMonth" className="font-medium mb-1">
            To Month
          </label>
          <input
            type="month"
            id="toMonth"
            name="toMonth"
            value={filters.toMonth}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex flex-col flex-grow min-w-[200px]">
          <label htmlFor="scheme" className="font-medium mb-1">
            Scheme
          </label>
          <input
            type="text"
            id="scheme"
            name="scheme"
            placeholder="Filter by scheme"
            value={filters.scheme}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="overflow-x-auto rounded border shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-100 text-blue-700 font-semibold">
            <tr>
              <th className="p-3 border">Month</th>
              <th className="p-3 border">Scheme</th>
              <th className="p-3 border text-right">Pending Commission (₹)</th>
              <th className="p-3 border text-right">Paid Commission (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map(({ month, scheme, pending, paid }, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                  <td className="p-3 border">{month}</td>
                  <td className="p-3 border">{scheme}</td>
                  <td className="p-3 border text-right">{pending.toLocaleString()}</td>
                  <td className="p-3 border text-right">{paid.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="p-3 text-center text-gray-500 border"
                >
                  No records found.
                </td>
              </tr>
            )}
            {filteredData.length > 0 && (
              <tr className="font-semibold bg-blue-200">
                <td className="p-3 border text-right" colSpan="2">
                  Totals
                </td>
                <td className="p-3 border text-right">{totalPending.toLocaleString()}</td>
                <td className="p-3 border text-right">{totalPaid.toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4">
        <button
          onClick={exportCSV}
          className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          Export to CSV
        </button>
        <button
          onClick={exportPDF}
          className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}
