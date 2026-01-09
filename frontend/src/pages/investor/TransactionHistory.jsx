import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

export default function TransactionHistory() {
  const { fetchWithAuth } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setError("");
    try {
      const res = await fetchWithAuth("/investor/investor/transactionhistory");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Transaction ID</th>
              <th className="p-2 border">Folio</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Scheme</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Units</th>
              <th className="p-2 border">NAV per Unit (₹)</th>
              <th className="p-2 border">Amount (₹)</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.txn_id} className="hover:bg-gray-50">
                <td className="p-2 border">{t.txn_id}</td>
                <td className="p-2 border">{t.folio_number}</td>
                <td className="p-2 border">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-2 border">{t.scheme_id}</td>
                <td className="p-2 border">{t.txn_type}</td>
                <td className="p-2 border">{t.units.toFixed(4)}</td>
                <td className="p-2 border">₹{t.nav.toFixed(2)}</td>
                <td className="p-2 border">₹{t.amount.toLocaleString()}</td>
                <td className={`p-2 border font-semibold ${t.status === "Completed" ? "text-green-600" : "text-yellow-600"}`}>
                  {t.status}
                </td>
                <td className="p-2 border">{t.txn_type + " transaction"}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
