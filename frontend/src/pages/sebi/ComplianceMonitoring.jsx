// File: src/pages/sebi/ComplianceMonitoring.jsx
import React, { useState } from "react";

const dummyData = [
  {
    id: 1,
    amc: "Visionary Mutual Fund",
    rta: "RTA One",
    scheme: "Visionary Bluechip Fund",
    date: "2024-09-20",
    exceptionType: "KYC Failure",
    details: "PAN mismatch for investor I005",
  },
  {
    id: 2,
    amc: "Progressive AMC",
    rta: "RTA Two",
    scheme: "Progressive Midcap Fund",
    date: "2024-09-10",
    exceptionType: "NAV Mismatch",
    details: "Reported NAV differs from calculated NAV on 2024-09-10",
  },
  {
    id: 3,
    amc: "Horizon Fund House",
    rta: "RTA One",
    scheme: "Horizon Debt Fund",
    date: "2024-09-18",
    exceptionType: "Delayed Payout",
    details: "IDCW payout delayed by 5 days",
  },
];

export default function ComplianceMonitoring() {
  const [filters, setFilters] = useState({
    amc: "",
    rta: "",
    scheme: "",
    fromDate: "",
    toDate: "",
  });
  const [expandedRow, setExpandedRow] = useState(null);

  const filteredData = dummyData.filter((item) => {
    const matchAMC = filters.amc
      ? item.amc.toLowerCase().includes(filters.amc.toLowerCase())
      : true;
    const matchRTA = filters.rta
      ? item.rta.toLowerCase().includes(filters.rta.toLowerCase())
      : true;
    const matchScheme = filters.scheme
      ? item.scheme.toLowerCase().includes(filters.scheme.toLowerCase())
      : true;
    const matchFromDate = filters.fromDate
      ? new Date(item.date) >= new Date(filters.fromDate)
      : true;
    const matchToDate = filters.toDate
      ? new Date(item.date) <= new Date(filters.toDate)
      : true;
    return matchAMC && matchRTA && matchScheme && matchFromDate && matchToDate;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-red-700 mb-6">
        Compliance Monitoring
      </h1>

      <div className="bg-white shadow rounded p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <input
          name="amc"
          value={filters.amc}
          onChange={handleChange}
          placeholder="Filter by AMC"
          className="border p-2 rounded"
          autoComplete="off"
        />
        <input
          name="rta"
          value={filters.rta}
          onChange={handleChange}
          placeholder="Filter by RTA"
          className="border p-2 rounded"
          autoComplete="off"
        />
        <input
          name="scheme"
          value={filters.scheme}
          onChange={handleChange}
          placeholder="Filter by Scheme"
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
              <th className="p-3 border">AMC</th>
              <th className="p-3 border">RTA</th>
              <th className="p-3 border">Scheme</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Exception Type</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map((item) => (
                <React.Fragment key={item.id}>
                  <tr
                    className="cursor-pointer hover:bg-red-50"
                    onClick={() =>
                      setExpandedRow(expandedRow === item.id ? null : item.id)
                    }
                  >
                    <td className="p-3 border">{item.amc}</td>
                    <td className="p-3 border">{item.rta}</td>
                    <td className="p-3 border">{item.scheme}</td>
                    <td className="p-3 border">{item.date}</td>
                    <td className="p-3 border">{item.exceptionType}</td>
                    <td className="p-3 border text-red-600 underline">
                      {expandedRow === item.id ? "Hide Details" : "View Details"}
                    </td>
                  </tr>
                  {expandedRow === item.id && (
                    <tr>
                      <td
                        className="p-3 border bg-red-50 text-red-700"
                        colSpan={6}
                      >
                        <strong>Details: </strong> {item.details}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  className="p-3 border text-center text-gray-500"
                  colSpan={6}
                >
                  No compliance exceptions found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
