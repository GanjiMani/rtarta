import React, { useState } from "react";

const initialJobs = [
  {
    Job_ID: "B001",
    Description: "Monthly SIP Bulk Upload",
    Status: "Completed",
    Scheduled_Time: "2024-09-01 00:00",
    Last_Run: "2024-08-31 23:50",
    Next_Run: "2024-09-30 00:00"
  },
  {
    Job_ID: "B002",
    Description: "Daily NAV Recalculation",
    Status: "Running",
    Scheduled_Time: "Every day 20:00",
    Last_Run: "2024-09-26 20:00",
    Next_Run: "2024-09-27 20:00"
  }
];

export default function BatchJobManagement() {
  const [jobs, setJobs] = useState(initialJobs);

  const handleRunJob = (jobId) => {
    alert(`Job ${jobId} triggered successfully.`);
    // In real system, call backend API to trigger job
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Batch Job Management</h1>

      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-100 text-blue-700">
              {[
                "Job ID",
                "Description",
                "Status",
                "Scheduled Time",
                "Last Run",
                "Next Run",
                "Actions"
              ].map((col) => (
                <th key={col} className="px-4 py-2 text-left text-sm font-semibold border-b">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.Job_ID} className="hover:bg-gray-50 text-black">
                <td className="px-4 py-2 border-b">{job.Job_ID}</td>
                <td className="px-4 py-2 border-b">{job.Description}</td>
                <td className="px-4 py-2 border-b">{job.Status}</td>
                <td className="px-4 py-2 border-b">{job.Scheduled_Time}</td>
                <td className="px-4 py-2 border-b">{job.Last_Run}</td>
                <td className="px-4 py-2 border-b">{job.Next_Run}</td>
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleRunJob(job.Job_ID)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >
                    Run Now
                  </button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">No batch jobs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
