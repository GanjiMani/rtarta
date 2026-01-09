import React, { useState, useEffect } from "react";

const dummySchemes = [
  { name: "Equity Growth Fund", nav: 145.32, lastUpdate: "2025-09-20" },
  { name: "Debt Stability Fund", nav: 102.15, lastUpdate: "2025-09-20" },
  { name: "Balanced Advantage Fund", nav: 89.75, lastUpdate: "2025-09-19" },
  { name: "Small Cap Opportunities", nav: 220.04, lastUpdate: "2025-09-15" }, // stale
];

function isStaleDate(dateStr) {
  const date = new Date(dateStr);
  const diffDays = (new Date() - date) / (1000*60*60*24);
  return diffDays > 2; // more than 2 days old is stale
}

export default function NAVMonitoring() {
  const [schemes, setSchemes] = useState(dummySchemes);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort descending by lastUpdate date
  useEffect(() => {
    const sorted = [...schemes].sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    setSchemes(sorted);
  }, []);

  const filteredSchemes = schemes.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">NAV Monitoring</h1>

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search schemes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-md w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Info line */}
      <p className="text-sm text-gray-600 mb-2">
        Showing {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? "s" : ""}.
      </p>

      <table className="w-full bg-white border rounded-lg shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Scheme</th>
            <th className="px-4 py-2">NAV (₹)</th>
            <th className="px-4 py-2">Last Update</th>
          </tr>
        </thead>
        <tbody>
          {filteredSchemes.map((s, i) => (
            <tr key={i} className={`border-t ${isStaleDate(s.lastUpdate) ? "bg-red-50" : ""}`}>
              <td className="px-4 py-2">{s.name}</td>
              <td className="px-4 py-2 font-medium">{s.nav.toFixed(2)}</td>
              <td className={`px-4 py-2 ${isStaleDate(s.lastUpdate) ? "text-red-600 font-semibold" : ""}`}>
                {s.lastUpdate}
                {isStaleDate(s.lastUpdate) && " (stale)"}
              </td>
            </tr>
          ))}
          {filteredSchemes.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No schemes match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
