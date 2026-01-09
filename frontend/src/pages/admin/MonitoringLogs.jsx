import React, { useState } from "react";

const dummyLogs = [
  {
    timestamp: "2025-10-12T17:23:45Z",
    user: "admin_user1",
    action: "User login",
    details: "User admin_user1 logged in from IP 192.168.1.10",
  },
  {
    timestamp: "2025-10-12T18:05:12Z",
    user: "rta_operator",
    action: "NAV Upload",
    details: "NAV data uploaded for fund ABC on 2025-10-12",
  },
  {
    timestamp: "2025-10-12T19:14:30Z",
    user: "admin_user2",
    action: "Settings changed",
    details: "System setting 'Max login attempts' updated to 5",
  },
  {
    timestamp: "2025-10-12T20:22:00Z",
    user: "support_staff",
    action: "Complaint resolved",
    details: "Complaint #12345 marked as resolved",
  },
  {
    timestamp: "2025-10-12T21:00:45Z",
    user: "rta_operator",
    action: "Batch job started",
    details: "Batch job ID 987 started processing",
  },
];

const MonitoringLogs = () => {
  const [logs] = useState(dummyLogs);

  return (
    <div>
      <h2>Monitoring Logs (Dummy Data)</h2>
      <table border="1" cellPadding="8" cellSpacing="0" width="100%">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan="4" align="center">No logs found.</td>
            </tr>
          ) : (
            logs.map((log, idx) => (
              <tr key={idx}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td>{log.details}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: "1rem" }}>
        <button disabled>Previous</button>
        <span style={{ margin: "0 1rem" }}>Page 1 of 1</span>
        <button disabled>Next</button>
      </div>
    </div>
  );
};

export default MonitoringLogs;
