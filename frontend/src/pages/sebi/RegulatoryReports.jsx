// File: src/pages/sebi/RegulatoryReports.jsx
import React, { useState } from "react";

const dummyReports = [
  {
    id: 1,
    type: "AMFI Monthly Report",
    amc: "Visionary Mutual Fund",
    submittedOn: "2024-09-25 10:12:00",
    fileHash: "a1b2c3d4e5f6g7h8i9j0",
    status: "Approved",
    downloadUrl: "#",
  },
  {
    id: 2,
    type: "SEBI Quarterly Filings",
    amc: "Progressive AMC",
    submittedOn: "2024-09-20 16:45:00",
    fileHash: "z9y8x7w6v5u4t3s2r1q0",
    status: "Flagged",
    downloadUrl: "#",
  },
  {
    id: 3,
    type: "NAV Reconciliation Report",
    amc: "Horizon Fund House",
    submittedOn: "2024-09-22 09:30:00",
    fileHash: "123456abcdef7890",
    status: "Pending",
    downloadUrl: "#",
  },
];

export default function RegulatoryReports() {
  const [reports, setReports] = useState(dummyReports);

  const toggleStatus = (id) => {
    setReports((prevReports) =>
      prevReports.map((r) => {
        if (r.id === id) {
          let newStatus = "Pending";
          if (r.status === "Pending") newStatus = "Approved";
          else if (r.status === "Approved") newStatus = "Flagged";
          else if (r.status === "Flagged") newStatus = "Pending";
          return { ...r, status: newStatus };
        }
        return r;
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-red-700 mb-6">
        Regulatory Reports
      </h1>
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full text-left border-collapse">
          <thead className="bg-red-100 text-red-700 font-semibold">
            <tr>
              <th className="p-3 border">Report Type</th>
              <th className="p-3 border">AMC</th>
              <th className="p-3 border">Submitted On</th>
              <th className="p-3 border">File Hash</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length ? (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-red-50 cursor-pointer">
                  <td className="p-3 border">{report.type}</td>
                  <td className="p-3 border">{report.amc}</td>
                  <td className="p-3 border">{report.submittedOn}</td>
                  <td className="p-3 border font-mono truncate max-w-xs">
                    {report.fileHash}
                  </td>
                  <td
                    className={`p-3 border font-semibold ${
                      report.status === "Approved"
                        ? "text-green-600"
                        : report.status === "Flagged"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {report.status}
                  </td>
                  <td className="p-3 border space-x-2">
                    <a
                      href={report.downloadUrl}
                      download
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => toggleStatus(report.id)}
                      className="px-3 py-1 rounded border border-red-600 text-red-600 hover:bg-red-100 transition"
                      title="Toggle Status: Pending → Approved → Flagged"
                    >
                      Toggle Status
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="p-3 border text-center text-gray-500"
                  colSpan={6}
                >
                  No reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
