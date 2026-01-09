import React, { useState } from "react";

const initialFilings = [
  {
    Filing_ID: "F001",
    Filing_Name: "Quarterly SEBI Compliance Q2",
    Submission_Date: "2024-07-15",
    Due_Date: "2024-07-20",
    Status: "Submitted",
    Submitted_By: "Admin01",
  },
  {
    Filing_ID: "F002",
    Filing_Name: "Annual Audit Report 2023",
    Submission_Date: "",
    Due_Date: "2024-10-31",
    Status: "Pending",
    Submitted_By: "",
  },
];

export default function RegulatoryFilings() {
  const [filings, setFilings] = useState(initialFilings);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredFilings = filings.filter(f =>
    (filterStatus === "All" || f.Status === filterStatus) &&
    (f.Filing_ID.toLowerCase().includes(search.toLowerCase()) ||
     f.Filing_Name.toLowerCase().includes(search.toLowerCase()))
  );

  const statuses = ["All", "Pending", "Submitted", "Rejected"];

  const handleSubmit = (id) => {
    setFilings(filings.map(f =>
      f.Filing_ID === id
        ? { ...f, Status: "Submitted", Submission_Date: new Date().toISOString().split('T')[0], Submitted_By: "Admin" }
        : f
    ));
    alert(`Regulatory filing ${id} marked as Submitted.`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Regulatory Filings</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Filing ID or Name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-100 text-blue-700">
              {[
                "Filing ID",
                "Filing Name",
                "Submission Date",
                "Due Date",
                "Status",
                "Submitted By",
                "Actions",
              ].map(col => (
                <th key={col} className="px-4 py-2 text-left text-sm font-semibold border-b">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredFilings.map(f => (
              <tr key={f.Filing_ID} className="hover:bg-gray-50 text-black">
                <td className="px-4 py-2 border-b">{f.Filing_ID}</td>
                <td className="px-4 py-2 border-b">{f.Filing_Name}</td>
                <td className="px-4 py-2 border-b">{f.Submission_Date || "---"}</td>
                <td className="px-4 py-2 border-b">{f.Due_Date}</td>
                <td className="px-4 py-2 border-b">{f.Status}</td>
                <td className="px-4 py-2 border-b">{f.Submitted_By || "---"}</td>
                <td className="px-4 py-2 border-b whitespace-nowrap">
                  {f.Status === "Pending" ? (
                    <button
                      onClick={() => handleSubmit(f.Filing_ID)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Mark Submitted
                    </button>
                  ) : (
                    <span className="text-gray-500">No actions</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredFilings.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No filings found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
