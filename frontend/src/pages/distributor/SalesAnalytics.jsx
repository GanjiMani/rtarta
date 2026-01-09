// File: src/pages/distributor/SalesAnalytics.jsx
import React, { useRef } from "react";
import Papa from "papaparse";
import html2canvas from "html2canvas";

export default function SalesAnalytics() {
  const chartRef = useRef();

  const salesByScheme = [
    { scheme: "Visionary Bluechip Fund", sales: 500000 },
    { scheme: "Progressive Debt Fund", sales: 350000 },
    { scheme: "Horizon Balanced Fund", sales: 220000 },
  ];

  const salesByMonth = [
    { month: "2025-07", sales: 300000 },
    { month: "2025-08", sales: 450000 },
    { month: "2025-09", sales: 320000 },
  ];

  const salesByChannel = [
    { channel: "Direct", sales: 400000 },
    { channel: "Distributor", sales: 350000 },
    { channel: "Online", sales: 320000 },
  ];

  const topClients = [
    { name: "Client A", totalInvested: 120000 },
    { name: "Client B", totalInvested: 95000 },
    { name: "Client C", totalInvested: 87000 },
  ];

  const conversionRate = 0.48; // Example

  // Export sales by scheme data as CSV
  const exportCSV = () => {
    const csv = Papa.unparse(
      salesByScheme.map(({ scheme, sales }) => ({ Scheme: scheme, Sales: sales }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales_by_scheme.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export sales by scheme table as PNG image
  const exportChartImage = () => {
    const node = chartRef.current;
    if (!node) return;
    html2canvas(node).then((canvas) => {
      const link = document.createElement("a");
      link.download = "sales_chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6">Sales Analytics</h1>

      {/* Sales by Scheme */}
      <section ref={chartRef}>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales by Scheme</h2>
        <table className="w-full border-collapse text-left rounded shadow overflow-hidden">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="p-3 border">Scheme</th>
              <th className="p-3 border text-right">Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {salesByScheme.map(({ scheme, sales }, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                <td className="p-3 border">{scheme}</td>
                <td className="p-3 border text-right">{sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Sales by Month */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales by Month</h2>
        <table className="w-full border-collapse text-left rounded shadow overflow-hidden">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="p-3 border">Month</th>
              <th className="p-3 border text-right">Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {salesByMonth.map(({ month, sales }, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                <td className="p-3 border">{month}</td>
                <td className="p-3 border text-right">{sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Sales by Channel */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales by Channel</h2>
        <table className="w-full border-collapse text-left rounded shadow overflow-hidden">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="p-3 border">Channel</th>
              <th className="p-3 border text-right">Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {salesByChannel.map(({ channel, sales }, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                <td className="p-3 border">{channel}</td>
                <td className="p-3 border text-right">{sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Top Clients */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Clients by Investment</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {topClients.map(({ name, totalInvested }, i) => (
            <li key={i}>
              <strong>{name}</strong>: ₹{totalInvested.toLocaleString()}
            </li>
          ))}
        </ul>
      </section>

      {/* Conversion Rate */}
      <section className="text-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Conversion Rate</h2>
        <p>{(conversionRate * 100).toFixed(2)}%</p>
      </section>

      {/* Export Buttons */}
      <section className="flex gap-4">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={exportCSV}
        >
          Export Data (CSV)
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={exportChartImage}
        >
          Export Chart (PNG)
        </button>
      </section>
    </div>
  );
}
