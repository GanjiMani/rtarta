import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const masterSchemes = {
  "HDFC AMC": ["HDFC Equity Fund", "HDFC Balanced Fund", "HDFC Debt Fund"],
  "Jio AMC": ["Jio Growth Fund", "Jio Tax Saver"],
  "NAVI MF": ["NAVI Large Cap Fund", "NAVI Mid Cap Fund"],
};

const dummyDataByScheme = {
  "HDFC Equity Fund": [
    { date: "2025-09-20", inflow: 12000000, outflow: 6000000 },
    { date: "2025-09-19", inflow: 14000000, outflow: 7000000 },
    // more data...
  ],
  "Jio Growth Fund": [
    { date: "2025-09-20", inflow: 8000000, outflow: 4000000 },
    { date: "2025-09-19", inflow: 9000000, outflow: 3500000 },
    // more data...
  ],
  "NAVI Large Cap Fund": [
    { date: "2025-09-20", inflow: 10000000, outflow: 5000000 },
    { date: "2025-09-19", inflow: 11000000, outflow: 4500000 },
    // more data...
  ],
};

function formatDateForInput(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export default function FundFlows({ userAMC = "HDFC AMC" }) {
  const schemes = masterSchemes[userAMC] || [];

  const [selectedScheme, setSelectedScheme] = useState(schemes[0] || "");
  const [data, setData] = useState(dummyDataByScheme[selectedScheme] || []);
  const [filteredData, setFilteredData] = useState(data);
  const [startDate, setStartDate] = useState(
    formatDateForInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 days ago
  );
  const [endDate, setEndDate] = useState(formatDateForInput(new Date()));

  useEffect(() => {
    setData(dummyDataByScheme[selectedScheme] || []);
  }, [selectedScheme]);

  useEffect(() => {
    const filtered = data.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );
    setFilteredData(filtered);
  }, [startDate, endDate, data]);

  const totalInflow = filteredData.reduce((acc, cur) => acc + cur.inflow, 0);
  const totalOutflow = filteredData.reduce((acc, cur) => acc + cur.outflow, 0);
  const netFlow = totalInflow - totalOutflow;

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Fund Flow Reports - {userAMC}
      </h1>

      <div className="mb-6 flex gap-6 items-center">
        <label className="font-semibold">
          Select Scheme:
          <select
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="ml-3 border px-3 py-1 rounded"
          >
            {schemes.map((scheme) => (
              <option key={scheme} value={scheme}>
                {scheme}
              </option>
            ))}
          </select>
        </label>

        <label className="font-semibold">
          From:
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="ml-3 border px-3 py-1 rounded"
          />
        </label>

        <label className="font-semibold">
          To:
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={formatDateForInput(new Date())}
            onChange={(e) => setEndDate(e.target.value)}
            className="ml-3 border px-3 py-1 rounded"
          />
        </label>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded p-4 shadow w-1/3 text-center">
          <p className="text-sm text-gray-500">Total Inflow</p>
          <p className="text-xl font-semibold text-green-600">
            ₹{totalInflow.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded p-4 shadow w-1/3 text-center">
          <p className="text-sm text-gray-500">Total Outflow</p>
          <p className="text-xl font-semibold text-red-600">
            ₹{totalOutflow.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded p-4 shadow w-1/3 text-center">
          <p className="text-sm text-gray-500">Net Flow</p>
          <p
            className={`text-xl font-semibold ${
              netFlow >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ₹{netFlow.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={filteredData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="inflow" stackId="a" fill="#16a34a" name="Inflow" />
            <Bar dataKey="outflow" stackId="a" fill="#dc2626" name="Outflow" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full bg-white border rounded-lg shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Inflow (₹)</th>
            <th className="px-4 py-2">Outflow (₹)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2 text-green-600 font-medium">
                  {row.inflow.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-red-600 font-medium">
                  {row.outflow.toLocaleString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No data for selected scheme and dates.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
