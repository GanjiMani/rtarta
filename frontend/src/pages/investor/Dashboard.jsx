import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

export default function Dashboard() {
  const { fetchWithAuth } = useAuth();

  const [summary, setSummary] = useState({ totalInvestment: 0, currentValue: 0, gainLoss: 0 });
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sips, setSips] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const holdingsRes = await fetchWithAuth("/investor/investor/foliosummary");
        if (!holdingsRes.ok) throw new Error("Failed to fetch holdings");
        const holdingsData = await holdingsRes.json();
        setHoldings(holdingsData);

        const transactionsRes = await fetchWithAuth("/investor/investor/transactionledger");
        if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);

        const sipsRes = await fetchWithAuth("/investor/sip/active");
        if (!sipsRes.ok) throw new Error("Failed to fetch SIPs");
        const sipsData = await sipsRes.json();
        setSips(sipsData);

        // Example summary calculations
        const totalInvestment = holdingsData.reduce((acc, h) => acc + h.total_value, 0);
        const currentValue = totalInvestment * 1.15; // example 15% gain
        const gainLoss = currentValue - totalInvestment;
        setSummary({ totalInvestment, currentValue, gainLoss });
      } catch (err) {
        setError(err.message);
      }
    }
    fetchDashboardData();
  }, [fetchWithAuth]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="bg-blue-600 text-white rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">Welcome back, Investor!</h1>
        <p className="mt-2 text-blue-100">Here’s a quick snapshot of your portfolio today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="text-gray-600">Total Investment</h3>
          <p className="text-2xl font-bold text-blue-600">₹{summary.totalInvestment.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="text-gray-600">Current Value</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.currentValue.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="text-gray-600">Gain / Loss</h3>
          <p className={`text-2xl font-bold ${summary.gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₹{summary.gainLoss.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8 overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">Your Holdings</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Scheme</th>
              <th className="p-2 border">Folio</th>
              <th className="p-2 border">Units</th>
              <th className="p-2 border">NAV</th>
              <th className="p-2 border">Value</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-2 border">{h.scheme_id}</td>
                <td className="p-2 border text-blue-600 hover:underline">
                  <Link to={`/folio/${h.folio_number}`}>{h.folio_number}</Link>
                </td>
                <td className="p-2 border">{h.total_units.toFixed(4)}</td>
                <td className="p-2 border">₹{h.last_nav.toFixed(2)}</td>
                <td className="p-2 border font-semibold">₹{h.total_value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
        <ul className="space-y-3">
          {transactions.map((t, i) => (
            <li key={i} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-semibold">{t.txn_type}</p>
                <p className="text-sm text-gray-500">{t.scheme_id}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-700">₹{t.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Active SIPs</h2>
        <ul className="space-y-3">
          {sips.map((s, i) => (
            <li key={i} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">{s.scheme_id}</p>
                <p className="text-sm text-gray-500">{new Date(s.date).toLocaleDateString()}</p>
              </div>
              <p className="text-blue-600 font-semibold">₹{s.amount.toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
