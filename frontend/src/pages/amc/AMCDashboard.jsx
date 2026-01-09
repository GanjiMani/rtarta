import React, { useEffect, useState } from "react";

// Dummy data from project doc examples for illustrative purposes
const dummySchemes = [
  {
    AMC_ID: "A001",
    AMC_Name: "Visionary Mutual Fund",
    Scheme_ID: "S001",
    Scheme_Name: "Visionary Bluechip Fund",
    Scheme_Type: "Equity",
    Plan_Type: "Direct",
    Option_Type: "Growth",
    NAV: 250.0,
  },
  {
    AMC_ID: "A001",
    AMC_Name: "Visionary Mutual Fund",
    Scheme_ID: "S002",
    Scheme_Name: "Visionary Liquid Fund",
    Scheme_Type: "Debt",
    Plan_Type: "Direct",
    Option_Type: "Growth",
    NAV: 1200.0,
  },
  {
    AMC_ID: "A002",
    AMC_Name: "Progressive AMC",
    Scheme_ID: "S003",
    Scheme_Name: "Progressive Midcap Fund",
    Scheme_Type: "Equity",
    Plan_Type: "Regular",
    Option_Type: "Growth",
    NAV: 80.0,
  },
  {
    AMC_ID: "A003",
    AMC_Name: "Horizon Fund House",
    Scheme_ID: "S004",
    Scheme_Name: "Horizon Debt Fund",
    Scheme_Type: "Debt",
    Plan_Type: "Direct",
    Option_Type: "IDCW Payout",
    NAV: 1050.0,
  },
  {
    AMC_ID: "A004",
    AMC_Name: "Pinnacle Funds",
    Scheme_ID: "S005",
    Scheme_Name: "Pinnacle Hybrid Fund",
    Scheme_Type: "Hybrid",
    Plan_Type: "Direct",
    Option_Type: "IDCW Reinvestment",
    NAV: 150.0,
  },
  {
    AMC_ID: "A005",
    AMC_Name: "Star Capital MF",
    Scheme_ID: "S006",
    Scheme_Name: "Star Small Cap Fund",
    Scheme_Type: "Equity",
    Plan_Type: "Direct",
    Option_Type: "Growth",
    NAV: 125.0,
  },
];

const dummyInvestorSummary = {
  totalInvestors: 20,
  assetsUnderManagement: 54000000,
  latestNAVDate: "2025-09-26",
  complianceStatus: "Completed",
};

export default function AMCDashboard() {
  const [schemes, setSchemes] = useState([]);
  const [summary, setSummary] = useState({
    totalInvestors: 0,
    assetsUnderManagement: 0,
    latestNAVDate: "",
    complianceStatus: "Pending",
  });

  useEffect(() => {
    // Simulate fetching from API
    setTimeout(() => {
      setSchemes(dummySchemes);
      setSummary(dummyInvestorSummary);
    }, 500);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-700">AMC Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="uppercase text-xs text-gray-500 mb-2">Total Schemes</p>
          <p className="text-2xl font-semibold text-blue-700">{schemes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="uppercase text-xs text-gray-500 mb-2">Total Investors</p>
          <p className="text-2xl font-semibold text-blue-700">{summary.totalInvestors}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="uppercase text-xs text-gray-500 mb-2">Assets Under Management</p>
          <p className="text-2xl font-semibold text-blue-700">
            ₹{summary.assetsUnderManagement.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="uppercase text-xs text-gray-500 mb-2">Latest NAV Date</p>
          <p className="text-2xl font-semibold text-blue-700">{summary.latestNAVDate}</p>
        </div>
      </div>

      {/* Compliance Status Alert */}
      <div
        className={`p-4 mb-10 rounded-md flex items-center ${
          summary.complianceStatus === "Completed"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        <strong className="mr-2">Compliance Status:</strong> {summary.complianceStatus}
      </div>

      {/* Detailed Schemes Table */}
      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Schemes List</h2>
        <table className="min-w-full border border-gray-200 rounded-md text-left">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="py-2 px-4 border border-gray-300">Scheme ID</th>
              <th className="py-2 px-4 border border-gray-300">Scheme Name</th>
              <th className="py-2 px-4 border border-gray-300">Type</th>
              <th className="py-2 px-4 border border-gray-300">Plan</th>
              <th className="py-2 px-4 border border-gray-300">Option</th>
              <th className="py-2 px-4 border border-gray-300">NAV (₹)</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(({ Scheme_ID, Scheme_Name, Scheme_Type, Plan_Type, Option_Type, NAV }) => (
              <tr key={Scheme_ID} className="even:bg-gray-50 hover:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">{Scheme_ID}</td>
                <td className="border border-gray-300 px-4 py-2">{Scheme_Name}</td>
                <td className="border border-gray-300 px-4 py-2">{Scheme_Type}</td>
                <td className="border border-gray-300 px-4 py-2">{Plan_Type}</td>
                <td className="border border-gray-300 px-4 py-2">{Option_Type}</td>
                <td className="border border-gray-300 px-4 py-2">{NAV.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
