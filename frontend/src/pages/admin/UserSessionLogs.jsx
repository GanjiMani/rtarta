import React, { useState, useEffect, useRef } from "react";

const initialSessions = [
  {
    Session_ID: "S001",
    Username: "adminuser",
    Login_Time: "2024-09-26T08:00:00Z",
    Logout_Time: "2024-09-26T16:00:00Z",
    IP_Address: "192.168.0.1",
    Status: "Logged out",
  },
  {
    Session_ID: "S002",
    Username: "operator1",
    Login_Time: "2024-09-26T09:30:00Z",
    Logout_Time: null,
    IP_Address: "192.168.0.15",
    Status: "Active",
  },
];

const sessionsPerPage = 10;

export default function UserSessionLogs() {
  const [sessions] = useState(initialSessions);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
      setLoading(false);
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

  const filteredSessions = sessions.filter((s) => {
    const matchesStatus = filterStatus === "All" || s.Status === filterStatus;
    const matchesSearch =
      s.Session_ID.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.Username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.IP_Address.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  );

  const statuses = ["All", "Active", "Logged out"];

  const exportCSV = () => {
    const csvData = [
      ["Session ID", "Username", "Login Time", "Logout Time", "IP Address", "Status"],
      ...filteredSessions.map((s) => [
        `"${s.Session_ID}"`,
        `"${s.Username}"`,
        `"${s.Login_Time ? new Date(s.Login_Time).toLocaleString() : "-"}"`,
        `"${s.Logout_Time ? new Date(s.Logout_Time).toLocaleString() : "-"}"`,
        `"${s.IP_Address}"`,
        `"${s.Status}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_session_logs.csv";
    a.click();
  };

  return (
    <main className="p-6 max-w-6xl mx-auto" role="main" aria-label="User Session Logs">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">User Session Logs</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Session ID, Username, IP Address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search sessions by Session ID, Username, or IP Address"
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filter sessions by status"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={exportCSV}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Export filtered session logs as CSV"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="text-center py-8 text-gray-600">
          Loading...
        </div>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <table
            className="min-w-full bg-white border border-gray-200 rounded-md"
            role="table"
            aria-label="Table showing user session logs"
          >
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                {[
                  "Session ID",
                  "Username",
                  "Login Time",
                  "Logout Time",
                  "IP Address",
                  "Status",
                ].map((col) => (
                  <th key={col} className="px-4 py-2 text-left text-sm font-semibold border-b">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    No sessions found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((s) => (
                  <tr key={s.Session_ID} className="hover:bg-gray-50 text-black">
                    <td className="px-4 py-2 border-b">{s.Session_ID}</td>
                    <td className="px-4 py-2 border-b">{s.Username}</td>
                    <td className="px-4 py-2 border-b">
                      {s.Login_Time ? new Date(s.Login_Time).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {s.Logout_Time ? new Date(s.Logout_Time).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-2 border-b">{s.IP_Address}</td>
                    <td className="px-4 py-2 border-b">{s.Status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredSessions.length > sessionsPerPage && (
            <div className="flex justify-center gap-3 py-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
