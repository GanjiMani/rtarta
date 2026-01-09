// File: src/pages/distributor/ClientPortfolioView.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";

export default function ClientPortfolioView() {
  const { id } = useParams();

  // Dummy data for demonstration
  const holdings = [
    { scheme: "Visionary Bluechip Fund", units: 1200.5, currentValue: 150000 },
    { scheme: "Progressive Debt Fund", units: 800, currentValue: 92000 },
  ];

  const transactions = [
    {
      date: "2025-09-10",
      type: "Purchase",
      scheme: "Visionary Bluechip Fund",
      units: 200,
      amount: 25000,
      status: "Confirmed",
    },
    {
      date: "2025-08-20",
      type: "Redemption",
      scheme: "Progressive Debt Fund",
      units: 100,
      amount: 11500,
      status: "Confirmed",
    },
  ];

  const sipPlans = [
    { scheme: "Visionary Bluechip Fund", amount: 5000, frequency: "Monthly", nextDate: "2025-10-05" },
    { scheme: "Progressive Debt Fund", amount: 3000, frequency: "Quarterly", nextDate: "2025-12-01" },
  ];

  const [authorized, setAuthorized] = useState(true); // Simulate authorization

  const downloadStatement = () => {
    alert(`Downloading statement for client ${id}`);
    // Implement actual download logic/API call here
  };

  const initiateServiceRequest = (type) => {
    alert(`Initiating service request: ${type} for client ${id}`);
    // Implement navigation or popup for service request form
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6">
        Client Portfolio View - {id}
      </h1>

      {/* Holdings */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Holdings</h2>
        <div className="overflow-x-auto rounded shadow border">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-100 text-blue-800 font-semibold">
              <tr>
                <th className="p-3 border">Scheme Name</th>
                <th className="p-3 border">Units</th>
                <th className="p-3 border">Current Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(({ scheme, units, currentValue }, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                  <td className="p-3 border">{scheme}</td>
                  <td className="p-3 border">{units.toFixed(2)}</td>
                  <td className="p-3 border">{currentValue.toLocaleString()}</td>
                </tr>
              ))}
              {!holdings.length && (
                <tr>
                  <td colSpan="3" className="p-3 border text-center text-gray-500">
                    No holdings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Recent Transactions</h2>
        <div className="overflow-x-auto rounded shadow border">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-100 text-blue-800 font-semibold">
              <tr>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Type</th>
                <th className="p-3 border">Scheme</th>
                <th className="p-3 border">Units</th>
                <th className="p-3 border">Amount (₹)</th>
                <th className="p-3 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(({ date, type, scheme, units, amount, status }, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                  <td className="p-3 border">{date}</td>
                  <td className="p-3 border">{type}</td>
                  <td className="p-3 border">{scheme}</td>
                  <td className="p-3 border">{units.toFixed(2)}</td>
                  <td className="p-3 border">{amount.toLocaleString()}</td>
                  <td className="p-3 border">{status}</td>
                </tr>
              ))}
              {!transactions.length && (
                <tr>
                  <td colSpan="6" className="p-3 border text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SIP Plans */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-gray-800">SIP Plans</h2>
        <div className="overflow-x-auto rounded shadow border">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-100 text-blue-800 font-semibold">
              <tr>
                <th className="p-3 border">Scheme</th>
                <th className="p-3 border">Amount (₹)</th>
                <th className="p-3 border">Frequency</th>
                <th className="p-3 border">Next Installment Date</th>
              </tr>
            </thead>
            <tbody>
              {sipPlans.map(({ scheme, amount, frequency, nextDate }, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                  <td className="p-3 border">{scheme}</td>
                  <td className="p-3 border">{amount.toLocaleString()}</td>
                  <td className="p-3 border">{frequency}</td>
                  <td className="p-3 border">{new Date(nextDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {!sipPlans.length && (
                <tr>
                  <td colSpan="4" className="p-3 border text-center text-gray-500">
                    No SIP plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-4">
        {authorized && (
          <button
            onClick={downloadStatement}
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Download Statement
          </button>
        )}
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => initiateServiceRequest("KYC Update")}
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Initiate KYC Update
          </button>
          <button
            onClick={() => initiateServiceRequest("Bank Mandate")}
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Initiate Bank Mandate
          </button>
        </div>
      </section>
    </div>
  );
}
