import React, { useState } from "react";

const initialReports = [
  {
    id: 1,
    title: "Monthly SEBI Compliance",
    status: "Pending",
    dueDate: "2025-09-30",
    lastSubmitted: "2025-08-30",
  },
  {
    id: 2,
    title: "KYC Audit Report",
    status: "Submitted",
    dueDate: "2025-10-15",
    lastSubmitted: "2025-09-14",
  },
  {
    id: 3,
    title: "AML Review",
    status: "Pending",
    dueDate: "2025-10-05",
    lastSubmitted: null,
  },
];

const getStatusClasses = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Submitted":
      return "bg-blue-100 text-blue-800";
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function ComplianceReports() {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState("");
  const [modalReport, setModalReport] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null);

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(filter.toLowerCase()) ||
      r.status.toLowerCase().includes(filter.toLowerCase())
  );

  const openModal = (report) => {
    setModalReport(report);
    setUploadFile(null);
    setUploadMessage(null);
  };

  const closeModal = () => {
    setModalReport(null);
    setUploadFile(null);
    setUploadMessage(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file type if needed
      if (file.type !== "application/pdf") {
        setUploadMessage("Only PDF files are allowed.");
        setUploadFile(null);
      } else {
        setUploadFile(file);
        setUploadMessage(null);
      }
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      setUploadMessage("Please select a valid PDF file to upload.");
      return;
    }

    // Simulate upload delay
    setTimeout(() => {
      setUploadMessage("Upload successful!");
      setReports((prev) =>
        prev.map((r) =>
          r.id === modalReport.id
            ? {
                ...r,
                status: "Submitted",
                lastSubmitted: new Date().toISOString().slice(0, 10),
              }
            : r
        )
      );
    }, 1500);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Compliance Reports</h1>

      <input
        type="text"
        placeholder="Search by title or status..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 w-full max-w-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <ul className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((r) => (
            <li
              key={r.id}
              className="p-4 bg-white rounded-lg shadow flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 md:space-x-4"
            >
              <div>
                <h2 className="text-lg font-semibold">{r.title}</h2>
                <p className="text-sm text-gray-600">
                  Due Date: {r.dueDate}{" "}
                  {r.lastSubmitted && <>| Last Submitted: {r.lastSubmitted}</>}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClasses(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
                <button
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => openModal(r)}
                >
                  View
                </button>
                {r.status === "Pending" && (
                  <button
                    className="text-green-600 hover:text-green-800 font-medium"
                    onClick={() => openModal(r)}
                  >
                    Upload
                  </button>
                )}
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center">No matching compliance reports found.</p>
        )}
      </ul>

      {/* Modal */}
      {modalReport && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold mb-4">{modalReport.title}</h3>
            <p>Status: {modalReport.status}</p>
            <p>Due Date: {modalReport.dueDate}</p>
            {modalReport.lastSubmitted && <p>Last Submitted: {modalReport.lastSubmitted}</p>}

            {/* Upload form if Pending */}
            {modalReport.status === "Pending" && (
              <div className="mt-6">
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                {uploadMessage && <p className="mt-2 text-sm text-red-600">{uploadMessage}</p>}

                <button
                  onClick={handleUpload}
                  className="mt-4 bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700"
                >
                  Upload Report
                </button>
              </div>
            )}

            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-700 hover:text-gray-900 font-bold text-2xl"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
