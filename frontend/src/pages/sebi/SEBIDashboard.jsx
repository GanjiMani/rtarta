// File: src/pages/sebi/SEBIDashboard.jsx
import React from "react";

export default function SEBIDashboard() {
  const summaryMetrics = [
    { label: "Total AMCs", value: 25 },
    { label: "Schemes Monitored", value: 120 },
    { label: "Open Investor Complaints", value: 12 },
    { label: "Unclaimed Amounts (₹ Crores)", value: 3.4 },
    { label: "Pending Compliance Filings", value: 4 },
  ];

  const alerts = [
    "NAV submission delayed by AMC X - escalation initiated",
    "Unclaimed funds exceeding 3 years require action",
    "New circular issued regarding digital KYC requirements",
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold text-red-700 mb-6">SEBI Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {summaryMetrics.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-center items-center"
          >
            <p className="text-4xl font-bold text-red-700">{value}</p>
            <p className="text-gray-600 mt-2 text-center">{label}</p>
          </div>
        ))}
      </section>

      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Recent Alerts</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {alerts.map((alert, i) => (
            <li key={i}>{alert}</li>
          ))}
        </ul>
      </section>

      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Quick Access</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/sebi/compliance-monitoring"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Compliance Monitoring
          </a>
          <a
            href="/sebi/regulatory-reports"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Regulatory Reports
          </a>
          <a
            href="/sebi/audit-trail"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Audit Trail
          </a>
          <a
            href="/sebi/unclaimed-oversight"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Unclaimed Oversight
          </a>
        </div>
      </section>

      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Analytics Overview</h2>
        <p className="text-gray-500">Charts and graphs coming soon...</p>
      </section>
    </div>
  );
}
