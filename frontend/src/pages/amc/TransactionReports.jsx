import React, { useState } from "react";

// Sample transaction data enriched with AMC info
const dummyTransactions = [
  { id: "T001", date: "2025-09-20", investor: "Rohan Sharma", scheme: "Visionary Bluechip Fund", amount: 10000, type: "Fresh Purchase", status: "Completed", AMC_Name: "HDFC AMC" },
  { id: "T002", date: "2025-09-21", investor: "Priya Singh", scheme: "Progressive Midcap Fund", amount: 5000, type: "Redemption", status: "Pending", AMC_Name: "HDFC AMC" },
  { id: "T003", date: "2025-09-22", investor: "Alok Kumar", scheme: "Jio Growth Fund", amount: 7500, type: "Fresh Purchase", status: "Completed", AMC_Name: "Jio AMC" },
  // Add more transactions with AMC_Name accordingly
];

// Derive unique schemes for filter dropdown by AMC
const getUniqueSchemesByAMC = (transactions, amc) => {
  return [...new Set(transactions.filter(t => t.AMC_Name === amc).map(t => t.scheme))];
};

export default function TransactionReports({ userAMC = "HDFC AMC" }) {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterScheme, setFilterScheme] = useState("");
  const [filterInvestor, setFilterInvestor] = useState("");

  const availableSchemes = getUniqueSchemesByAMC(dummyTransactions, userAMC);

  const filtered = dummyTransactions.filter(t =>
    t.AMC_Name === userAMC &&
    (!filterStatus || t.status === filterStatus) &&
    (!filterDate || t.date === filterDate) &&
    (!filterScheme || t.scheme === filterScheme) &&
    (!filterInvestor || t.investor.toLowerCase().includes(filterInvestor.toLowerCase()))
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transaction Reports - {userAMC}</h1>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <select
          className="border px-3 py-2 rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded"
          value={filterScheme}
          onChange={(e) => setFilterScheme(e.target.value)}
        >
          <option value="">All Schemes</option>
          {availableSchemes.map(scheme => (
            <option key={scheme} value={scheme}>{scheme}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by investor"
          className="border px-3 py-2 rounded flex-grow max-w-sm"
          value={filterInvestor}
          onChange={(e) => setFilterInvestor(e.target.value)}
        />
      </div>

      <table className="w-full border rounded bg-white shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Transaction ID</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Investor</th>
            <th className="p-2 border">Scheme</th>
            <th className="p-2 border">Amount (₹)</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length ? (
            filtered.map(({ id, date, investor, scheme, amount, type, status }) => (
              <tr key={id}>
                <td className="p-2 border">{id}</td>
                <td className="p-2 border">{date}</td>
                <td className="p-2 border">{investor}</td>
                <td className="p-2 border">{scheme}</td>
                <td className="p-2 border">{amount.toLocaleString()}</td>
                <td className="p-2 border">{type}</td>
                <td className={`p-2 border font-semibold ${status === "Completed" ? "text-green-600" : "text-red-600"}`}>
                  {status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
