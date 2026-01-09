import React, { useState, useMemo } from "react";

// Dummy data simulating all AMC transactions via RTAs
const dummyTransactions = [
  { id: "T001", date: "2025-09-20", amc: "HDFC AMC", scheme: "HDFC Equity Fund", investor: "Rohan Sharma", amount: 10000, type: "Purchase", status: "Completed" },
  { id: "T002", date: "2025-09-21", amc: "Jio AMC", scheme: "Jio Growth Fund", investor: "Priya Singh", amount: 5000, type: "Redemption", status: "Pending" },
  { id: "T003", date: "2025-09-22", amc: "NAVI MF", scheme: "NAVI Large Cap Fund", investor: "Alok Kumar", amount: 7500, type: "SIP", status: "Completed" },
  // Add more transactions as needed
];

const PAGE_SIZE = 10;

// Helper to get unique values from transaction list
const getUniqueValues = (data, key) => [...new Set(data.map(item => item[key]))];

export default function SEBITransactionReports() {
  const [filterAMC, setFilterAMC] = useState("");
  const [filterScheme, setFilterScheme] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Filter transactions based on all selected filters
  const filteredTransactions = useMemo(() => {
    return dummyTransactions.filter(tx => {
      if (filterAMC && tx.amc !== filterAMC) return false;
      if (filterScheme && tx.scheme !== filterScheme) return false;
      if (filterType && tx.type !== filterType) return false;
      if (filterStatus && tx.status !== filterStatus) return false;
      if (filterStartDate && tx.date < filterStartDate) return false;
      if (filterEndDate && tx.date > filterEndDate) return false;
      return true;
    });
  }, [filterAMC, filterScheme, filterType, filterStatus, filterStartDate, filterEndDate]);

  // Extract filtered schemes dynamically based on AMC filter
  const schemesForSelectedAMC = filterAMC
    ? getUniqueValues(dummyTransactions.filter(tx => tx.amc === filterAMC), "scheme")
    : getUniqueValues(dummyTransactions, "scheme");

  const amcs = getUniqueValues(dummyTransactions, "amc");
  const transactionTypes = getUniqueValues(dummyTransactions, "type");
  const statuses = getUniqueValues(dummyTransactions, "status");

  // Pagination calculations
  const pageCount = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const displayedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">SEBI AMC Transaction Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select value={filterAMC} onChange={e => { setFilterAMC(e.target.value); setFilterScheme(""); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">All AMCs</option>
          {amcs.map(amc => <option key={amc} value={amc}>{amc}</option>)}
        </select>

        <select value={filterScheme} onChange={e => { setFilterScheme(e.target.value); setPage(1); }} className="border rounded px-3 py-2" disabled={!filterAMC}>
          <option value="">All Schemes</option>
          {schemesForSelectedAMC.map(scheme => <option key={scheme} value={scheme}>{scheme}</option>)}
        </select>

        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">All Transaction Types</option>
          {transactionTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>

        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">All Statuses</option>
          {statuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="border rounded px-3 py-2" placeholder="Start Date" />
        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="border rounded px-3 py-2" placeholder="End Date" />
      </div>

      <table className="w-full border rounded shadow bg-white overflow-x-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Transaction ID</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">AMC</th>
            <th className="p-2 border">Scheme</th>
            <th className="p-2 border">Investor</th>
            <th className="p-2 border">Amount (₹)</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {displayedTransactions.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">No transactions found matching criteria.</td>
            </tr>
          ) : (
            displayedTransactions.map(({ id, date, amc, scheme, investor, amount, type, status }) => (
              <tr key={id} className="hover:bg-gray-50">
                <td className="p-2 border">{id}</td>
                <td className="p-2 border">{date}</td>
                <td className="p-2 border">{amc}</td>
                <td className="p-2 border">{scheme}</td>
                <td className="p-2 border">{investor}</td>
                <td className="p-2 border">{amount.toLocaleString()}</td>
                <td className="p-2 border">{type}</td>
                <td className={`p-2 border font-semibold ${status === "Completed" ? "text-green-600" : "text-red-600"}`}>
                  {status}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="self-center">{page} / {pageCount}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, pageCount))}
            disabled={page === pageCount}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
