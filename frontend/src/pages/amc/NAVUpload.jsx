import React, { useState, useEffect } from "react";

// Dummy AMC + Scheme master database
const masterSchemes = [
  { AMC_ID: "A001", AMC_Name: "HDFC AMC", Scheme_ID: "S001", Scheme_Name: "HDFC Equity Fund" },
  { AMC_ID: "A001", AMC_Name: "HDFC AMC", Scheme_ID: "S002", Scheme_Name: "HDFC Balanced Fund" },
  { AMC_ID: "A002", AMC_Name: "Jio AMC", Scheme_ID: "S003", Scheme_Name: "Jio Growth Fund" },
  { AMC_ID: "A002", AMC_Name: "Jio AMC", Scheme_ID: "S004", Scheme_Name: "Jio Tax Saver" },
  { AMC_ID: "A003", AMC_Name: "NAVI MF", Scheme_ID: "S005", Scheme_Name: "NAVI Large Cap Fund" },
  { AMC_ID: "A003", AMC_Name: "NAVI MF", Scheme_ID: "S006", Scheme_Name: "NAVI Mid Cap Fund" },
];

export default function NAVUpload({ userAMC = "HDFC AMC" }) {
  const [file, setFile] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [navs, setNavs] = useState([]);
  const [search, setSearch] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Filter schemes to only those belonging to the user's AMC
  const filteredSchemes = masterSchemes.filter(s => s.AMC_Name === userAMC);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setUploadStatus(null);
  };

  // Dummy parse and upload simulation
  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({ success: false, message: "Please select a NAV file to upload." });
      return;
    }
    if (!selectedScheme) {
      setUploadStatus({ success: false, message: "Please select a scheme." });
      return;
    }

    // File type check
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type)) {
      setUploadStatus({ success: false, message: "Invalid file type. Upload CSV or Excel files only." });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    // Simulate file parsing and validation (replace with real API call in future)
    setTimeout(() => {
      // Simulated parsed data (all valid with current scheme & user AMC)
      const dummyUploadData = [
        {
          AMC_Name: userAMC,
          Scheme_Name: selectedScheme,
          NAV: Math.floor(Math.random() * 300) + 50,
          Effective_Date: new Date().toISOString().slice(0,10),
          Uploaded_By: "AMC User",
          Status: "Pending",
        },
      ];

      setNavs(prev => [...dummyUploadData, ...prev]);
      setUploading(false);
      setUploadStatus({ success: true, message: "NAV uploaded and processed successfully." });
      setFile(null);
      setSelectedScheme("");
      document.getElementById("file-input").value = null;
    }, 1500);
  };

  // Filtered NAVs by search input on scheme or AMC
  const filteredNavs = navs.filter(row =>
    row.Scheme_Name.toLowerCase().includes(search.toLowerCase()) ||
    row.AMC_Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">NAV Upload - {userAMC}</h1>

      {/* AMC Display */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold" htmlFor="amc">
          AMC
        </label>
        <input
          id="amc"
          type="text"
          value={userAMC}
          disabled
          className="border rounded px-3 py-2 w-full bg-gray-200 cursor-not-allowed"
        />
      </div>

      {/* Scheme Selector */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold" htmlFor="scheme-select">
          Select Scheme
        </label>
        <select
          id="scheme-select"
          value={selectedScheme}
          onChange={(e) => setSelectedScheme(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">-- Select Scheme --</option>
          {filteredSchemes.map(scheme => (
            <option key={scheme.Scheme_ID} value={scheme.Scheme_Name}>
              {scheme.Scheme_Name}
            </option>
          ))}
        </select>
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold" htmlFor="file-input">
          Select NAV File
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="w-full"
        />
      </div>

      {/* Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`px-6 py-2 rounded text-white ${uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {uploading ? "Uploading..." : "Upload NAV"}
        </button>

        <button
          onClick={() => alert("Download template action not implemented yet")}
          className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Download Template
        </button>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <p className={`mb-6 font-semibold ${uploadStatus.success ? "text-green-600" : "text-red-600"}`}>
          {uploadStatus.message}
        </p>
      )}

      {/* Uploaded NAVs Table */}
      <div className="overflow-x-auto bg-white rounded shadow p-2">
        <input
          type="text"
          placeholder="Search NAVs by AMC or Scheme"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 px-4 py-2 border rounded w-full"
          aria-label="Search NAV records"
        />
        <table className="min-w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-2 border border-gray-300">AMC Name</th>
              <th className="p-2 border border-gray-300">Scheme Name</th>
              <th className="p-2 border border-gray-300">NAV</th>
              <th className="p-2 border border-gray-300">Effective Date</th>
              <th className="p-2 border border-gray-300">Uploaded By</th>
              <th className="p-2 border border-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredNavs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No NAV records found
                </td>
              </tr>
            ) : (
              filteredNavs.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-300">{row.AMC_Name}</td>
                  <td className="p-2 border border-gray-300">{row.Scheme_Name}</td>
                  <td className="p-2 border border-gray-300">{row.NAV}</td>
                  <td className="p-2 border border-gray-300">{row.Effective_Date}</td>
                  <td className="p-2 border border-gray-300">{row.Uploaded_By}</td>
                  <td className="p-2 border border-gray-300">{row.Status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-gray-600">Total NAV Records: {filteredNavs.length}</p>
    </div>
  );
}
