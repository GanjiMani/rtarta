import React, { useState } from "react";

const initialKYCRecords = [
  {
    InvestorName: "Neha Gupta",
    FolioNumber: "F004",
    PAN: "PQRST3456U",
    KYCStatus: "Pending",
    SubmittedOn: "2024-09-05",
    VerifiedBy: "-",
  },
  {
    InvestorName: "Vijay Patil",
    FolioNumber: "F005",
    PAN: "VWXYZ7890A",
    KYCStatus: "Verified",
    SubmittedOn: "2024-08-20",
    VerifiedBy: "Admin01",
  },
];

export default function KYCVerification() {
  const [kycRecords, setKycRecords] = useState(initialKYCRecords);
  const [search, setSearch] = useState("");

  const filteredRecords = kycRecords.filter(record =>
    record.InvestorName.toLowerCase().includes(search.toLowerCase()) ||
    record.FolioNumber.toLowerCase().includes(search.toLowerCase()) ||
    record.PAN.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = (folioNumber) => {
    setKycRecords(kycRecords.map(rec =>
      rec.FolioNumber === folioNumber
        ? { ...rec, KYCStatus: "Verified", VerifiedBy: "Admin" }
        : rec
    ));
    alert(`KYC for folio ${folioNumber} marked as Verified.`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-700">KYC Verification</h1>

      <input
        type="text"
        placeholder="Search by Investor Name, Folio, PAN"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full md:w-1/3 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-100 text-blue-700">
              {["Investor Name", "Folio Number", "PAN", "KYC Status", "Submitted On", "Verified By", "Actions"].map((header) => (
                <th key={header} className="px-4 py-2 text-left text-sm font-semibold border-b">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => (
              <tr key={record.FolioNumber} className="hover:bg-gray-50 text-black">
                <td className="px-4 py-2 border-b">{record.InvestorName}</td>
                <td className="px-4 py-2 border-b">{record.FolioNumber}</td>
                <td className="px-4 py-2 border-b">{record.PAN}</td>
                <td className="px-4 py-2 border-b">{record.KYCStatus}</td>
                <td className="px-4 py-2 border-b">{record.SubmittedOn}</td>
                <td className="px-4 py-2 border-b">{record.VerifiedBy}</td>
                <td className="px-4 py-2 border-b">
                  {record.KYCStatus === "Pending" ? (
                    <button
                      onClick={() => handleVerify(record.FolioNumber)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded whitespace-nowrap"
                    >
                      Verify
                    </button>
                  ) : (
                    <span className="text-gray-500">--</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
