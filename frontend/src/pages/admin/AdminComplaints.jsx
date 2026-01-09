import React, { useState } from "react";

const initialComplaints = [
  {
    Complaint_ID: "C001",
    Investor_Name: "Neha Gupta",
    Folio_Number: "F004",
    Complaint_Type: "Transaction Delay",
    Description: "Redemption request delayed beyond service level",
    Status: "Open",
    Assigned_To: "Agent A",
    Date_Received: "2024-09-20",
    Resolution_Deadline: "2024-09-27"
  },
  {
    Complaint_ID: "C002",
    Investor_Name: "Vijay Patil",
    Folio_Number: "F005",
    Complaint_Type: "Incorrect NAV",
    Description: "Suspicious NAV values observed in last 2 weeks",
    Status: "In Progress",
    Assigned_To: "Agent B",
    Date_Received: "2024-09-22",
    Resolution_Deadline: "2024-09-29"
  }
];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredComplaints = complaints.filter(c =>
    (filterStatus === "All" || c.Status === filterStatus) &&
    (c.Complaint_ID.toLowerCase().includes(search.toLowerCase()) ||
    c.Investor_Name.toLowerCase().includes(search.toLowerCase()) ||
    c.Folio_Number.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStatusUpdate = (id, newStatus) => {
    setComplaints(complaints.map(c =>
      c.Complaint_ID === id
        ? { ...c, Status: newStatus }
        : c
    ));
    alert(`Complaint ${id} marked as ${newStatus}.`);
  };

  const statuses = ["All", "Open", "In Progress", "Resolved", "Closed"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Complaints Management</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Complaint ID, Investor Name, Folio Number"
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
                "Complaint ID",
                "Investor Name",
                "Folio Number",
                "Complaint Type",
                "Description",
                "Status",
                "Assigned To",
                "Date Received",
                "Resolution Deadline",
                "Actions"
              ].map(col => (
                <th key={col} className="px-4 py-2 text-left text-sm font-semibold border-b">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map(c => (
              <tr key={c.Complaint_ID} className="hover:bg-gray-50 text-black">
                <td className="px-4 py-2 border-b">{c.Complaint_ID}</td>
                <td className="px-4 py-2 border-b">{c.Investor_Name}</td>
                <td className="px-4 py-2 border-b">{c.Folio_Number}</td>
                <td className="px-4 py-2 border-b">{c.Complaint_Type}</td>
                <td className="px-4 py-2 border-b">{c.Description}</td>
                <td className="px-4 py-2 border-b">{c.Status}</td>
                <td className="px-4 py-2 border-b">{c.Assigned_To}</td>
                <td className="px-4 py-2 border-b">{c.Date_Received}</td>
                <td className="px-4 py-2 border-b">{c.Resolution_Deadline}</td>
                <td className="px-4 py-2 border-b whitespace-nowrap">
                  {c.Status !== "Resolved" && c.Status !== "Closed" ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(c.Complaint_ID, "In Progress")}
                        className="bg-yellow-400 text-black px-2 py-1 rounded mr-2 hover:bg-yellow-500"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(c.Complaint_ID, "Resolved")}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Mark Resolved
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500">No actions</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredComplaints.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">
                  No complaints matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
