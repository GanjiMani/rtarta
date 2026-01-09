import React, { useState } from "react";

// Dummy report data
const reportTypes = [
  "Investor Portfolio Summary",
  "Transaction Summary",
  "NAV History",
  "Capital Gains Report",
  "Unclaimed Amounts Report"
];

const dummyReports = {
  "Investor Portfolio Summary": [
    { Investor_Name: "Rohan Sharma", PAN: "ABCDE1234F", Folio_Number: "F001", AMC_Name: "Visionary Mutual Fund", Scheme_Name: "Visionary Bluechip Fund", Total_Units: 63.0044, Current_Value: 16000 },
    { Investor_Name: "Priya Singh", PAN: "FGHIJ5678K", Folio_Number: "F002", AMC_Name: "Progressive AMC", Scheme_Name: "Progressive Midcap Fund", Total_Units: 225, Current_Value: 18000 }
  ],
  "Transaction Summary": [
    { Transaction_ID: "T001", Folio_Number: "F001", Investor_Name: "Rohan Sharma", Transaction_Type: "Fresh Purchase", Amount: 10000, Units: 40, NAV: 250, Status: "Completed", Date: "2024-06-25" },
    { Transaction_ID: "T002", Folio_Number: "F001", Investor_Name: "Rohan Sharma", Transaction_Type: "Add Purchase", Amount: 5000, Units: 19.2308, NAV: 260, Status: "Completed", Date: "2024-07-01" }
  ],
  "NAV History": [
    { AMC_Name: "Visionary Mutual Fund", Scheme_Name: "Visionary Bluechip Fund", NAV: 250, Effective_Date: "2024-06-25" },
    { AMC_Name: "Visionary Mutual Fund", Scheme_Name: "Visionary Bluechip Fund", NAV: 260, Effective_Date: "2024-07-01" }
  ],
  "Capital Gains Report": [
    { Investor_Name: "Rohan Sharma", PAN: "ABCDE1234F", Folio_Number: "F001", Scheme_Name: "Visionary Bluechip Fund", ShortTerm: 500, LongTerm: 2000 }
  ],
  "Unclaimed Amounts Report": [
    { Investor_Name: "Neha Gupta", Folio_Number: "F004", AMC_Name: "Horizon Fund House", Scheme_Name: "Horizon Debt Fund", Transaction_Type: "IDCW Payout", Amount: 150, Status: "Pending" }
  ]
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(reportTypes[0]);
  const [search, setSearch] = useState("");

  const filteredData = dummyReports[selectedReport].filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Reports</h1>

      {/* Report Type Selector */}
      <div className="flex gap-4 mb-4">
        {reportTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedReport(type)}
            className={`px-4 py-2 rounded font-medium ${
              selectedReport === type ? "bg-blue-600 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-100">
              {Object.keys(filteredData[0] || {}).map(col => (
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
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 text-black">
                {Object.values(row).map((val, i) => (
                  <td key={i} className="px-4 py-2 border-b">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex gap-6">
        <p className="text-black text-sm font-medium">Total Records: {filteredData.length}</p>
      </div>

      {/* Export Button */}
      <div className="mt-4">
        <button
          onClick={() => alert("Export functionality (dummy action)")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
