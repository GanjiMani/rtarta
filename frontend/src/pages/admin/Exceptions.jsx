import React, { useState } from "react";

// Dummy exception data
const dummyExceptions = [
  {
    Exception_ID: "E001",
    Transaction_ID: "T002",
    Folio_Number: "F002",
    Investor_Name: "Priya Singh",
    PAN: "FGHIJ5678K",
    AMC_Name: "Progressive AMC",
    Scheme_Name: "Progressive Midcap Fund",
    Transaction_Type: "Fresh Purchase",
    Issue: "Amount mismatch: AMC vs RTA",
    Status: "Pending",
    Reported_By: "System",
    Reported_Date: "2024-07-02",
    Resolution_Date: "-"
  },
  {
    Exception_ID: "E002",
    Transaction_ID: "T010",
    Folio_Number: "F004",
    Investor_Name: "Neha Gupta",
    PAN: "PQRST3456U",
    AMC_Name: "Horizon Fund House",
    Scheme_Name: "Horizon Debt Fund",
    Transaction_Type: "IDCW Payout",
    Issue: "Unclaimed payout not processed",
    Status: "Escalated",
    Reported_By: "System",
    Reported_Date: "2024-10-02",
    Resolution_Date: "-"
  },
  {
    Exception_ID: "E003",
    Transaction_ID: "T011",
    Folio_Number: "F005",
    Investor_Name: "Vijay Patil",
    PAN: "VWXYZ7890A",
    AMC_Name: "Pinnacle Funds",
    Scheme_Name: "Pinnacle Hybrid Fund",
    Transaction_Type: "IDCW Reinvestment",
    Issue: "NAV missing for reinvestment",
    Status: "Resolved",
    Reported_By: "Admin",
    Reported_Date: "2024-10-03",
    Resolution_Date: "2024-10-05"
  }
];

export default function Exceptions() {
  const [exceptions, setExceptions] = useState(dummyExceptions);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  // Filter exceptions
  const filteredExceptions = exceptions.filter((ex) => {
    return (
      (filterStatus === "All" || ex.Status === filterStatus) &&
      (filterType === "All" || ex.Transaction_Type === filterType) &&
      (ex.Folio_Number.toLowerCase().includes(search.toLowerCase()) ||
        ex.Investor_Name.toLowerCase().includes(search.toLowerCase()) ||
        ex.PAN.toLowerCase().includes(search.toLowerCase()) ||
        ex.AMC_Name.toLowerCase().includes(search.toLowerCase()) ||
        ex.Scheme_Name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const transactionTypes = ["All", ...new Set(exceptions.map((ex) => ex.Transaction_Type))];
  const statuses = ["All", "Pending", "Resolved", "Escalated"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Exceptions Management</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Folio, Investor, PAN, AMC, Scheme"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {transactionTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-100">
              {[
                "Exception_ID",
                "Transaction_ID",
                "Folio_Number",
                "Investor_Name",
                "PAN",
                "AMC_Name",
                "Scheme_Name",
                "Transaction_Type",
                "Issue",
                "Status",
                "Reported_By",
                "Reported_Date",
                "Resolution_Date"
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-sm font-semibold text-blue-700 border-b"
                >
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredExceptions.map((ex, idx) => (
              <tr key={idx} className="hover:bg-gray-50 text-black">
                <td className="px-4 py-2 border-b">{ex.Exception_ID}</td>
                <td className="px-4 py-2 border-b">{ex.Transaction_ID}</td>
                <td className="px-4 py-2 border-b">{ex.Folio_Number}</td>
                <td className="px-4 py-2 border-b">{ex.Investor_Name}</td>
                <td className="px-4 py-2 border-b">{ex.PAN}</td>
                <td className="px-4 py-2 border-b">{ex.AMC_Name}</td>
                <td className="px-4 py-2 border-b">{ex.Scheme_Name}</td>
                <td className="px-4 py-2 border-b">{ex.Transaction_Type}</td>
                <td className="px-4 py-2 border-b">{ex.Issue}</td>
                <td className="px-4 py-2 border-b">{ex.Status}</td>
                <td className="px-4 py-2 border-b">{ex.Reported_By}</td>
                <td className="px-4 py-2 border-b">{ex.Reported_Date}</td>
                <td className="px-4 py-2 border-b">{ex.Resolution_Date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex gap-6">
        {statuses.filter(s => s !== "All").map(s => (
          <p key={s} className="text-black text-sm font-medium">
            {s}: {filteredExceptions.filter(ex => ex.Status === s).length}
          </p>
        ))}
      </div>
    </div>
  );
}
