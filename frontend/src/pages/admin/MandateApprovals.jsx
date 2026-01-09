import React, { useState } from "react";

const initialMandates = [
  {
    Mandate_ID: "M001",
    Investor_Name: "Neha Gupta",
    Folio_Number: "F004",
    Bank_Name: "HDFC Bank",
    Mandate_Type: "New Mandate",
    Status: "Pending",
    Submitted_Date: "2024-09-15",
    Verified_By: "-"
  },
  {
    Mandate_ID: "M002",
    Investor_Name: "Vijay Patil",
    Folio_Number: "F005",
    Bank_Name: "ICICI Bank",
    Mandate_Type: "Renewal",
    Status: "Verified",
    Submitted_Date: "2024-09-10",
    Verified_By: "Admin01"
  }
];

export default function MandateApprovals() {
  const [mandates, setMandates] = useState(initialMandates);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredMandates = mandates.filter(m =>
    (filterStatus === "All" || m.Status === filterStatus) &&
    (m.Mandate_ID.toLowerCase().includes(search.toLowerCase()) ||
     m.Investor_Name.toLowerCase().includes(search.toLowerCase()) ||
     m.Folio_Number.toLowerCase().includes(search.toLowerCase()) ||
     m.Bank_Name.toLowerCase().includes(search.toLowerCase()))
  );

  const statuses = ["All", "Pending", "Verified", "Rejected"];

  const handleStatusUpdate = (id, status) => {
    setMandates(mandates.map(m =>
      m.Mandate_ID === id
        ? { ...m, Status: status, Verified_By: status === "Verified" ? "Admin" : "-" }
        : m
    ));
    alert(`Mandate ${id} marked as ${status}.`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Mandate Approvals</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Mandate ID, Investor, Folio, Bank"
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
                "Mandate ID",
                "Investor Name",
                "Folio Number",
                "Bank Name",
                "Mandate Type",
                "Status",
                "Submitted Date",
                "Verified By",
                "Actions"
              ].map(col => (
                <th key={col} className="px-4 py-2 text-left text-sm font-semibold border-b">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMandates.map(m => (
              <tr key={m.Mandate_ID} className="hover:bg-gray-50 text-black">
                <td className="px-4 py-2 border-b">{m.Mandate_ID}</td>
                <td className="px-4 py-2 border-b">{m.Investor_Name}</td>
                <td className="px-4 py-2 border-b">{m.Folio_Number}</td>
                <td className="px-4 py-2 border-b">{m.Bank_Name}</td>
                <td className="px-4 py-2 border-b">{m.Mandate_Type}</td>
                <td className="px-4 py-2 border-b">{m.Status}</td>
                <td className="px-4 py-2 border-b">{m.Submitted_Date}</td>
                <td className="px-4 py-2 border-b">{m.Verified_By}</td>
                <td className="px-4 py-2 border-b whitespace-nowrap">
                  {m.Status === "Pending" ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(m.Mandate_ID, "Verified")}
                        className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(m.Mandate_ID, "Rejected")}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500">No actions</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredMandates.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  No mandates match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
