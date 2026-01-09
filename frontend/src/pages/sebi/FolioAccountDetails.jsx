import React, { useState } from "react";

// Dummy folio account data simulating final account details of folios across AMCs and schemes
const dummyFolios = [
  {
    folioNumber: "F12345",
    investorName: "Rohan Sharma",
    amc: "HDFC AMC",
    scheme: "HDFC Equity Fund",
    holdings: 1000,
    nav: 150.25,
    marketValue: 150250,
    lastTransactionDate: "2025-09-15",
    status: "Active",
  },
  {
    folioNumber: "F67890",
    investorName: "Priya Singh",
    amc: "Jio AMC",
    scheme: "Jio Growth Fund",
    holdings: 500,
    nav: 125.75,
    marketValue: 62875,
    lastTransactionDate: "2025-09-10",
    status: "Active",
  },
  // Add more folio data here
];

export default function FolioAccountDetails() {
  const [filterAMC, setFilterAMC] = useState("");
  const [filterScheme, setFilterScheme] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const amcs = [...new Set(dummyFolios.map(folio => folio.amc))];
  const schemesByAMC = filterAMC
    ? [...new Set(dummyFolios.filter(folio => folio.amc === filterAMC).map(folio => folio.scheme))]
    : [...new Set(dummyFolios.map(folio => folio.scheme))];

  const filteredFolios = dummyFolios.filter(folio => {
    return (
      (filterAMC === "" || folio.amc === filterAMC) &&
      (filterScheme === "" || folio.scheme === filterScheme) &&
      (folio.folioNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
       folio.investorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Folio Final Account Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          value={filterAMC}
          onChange={e => { setFilterAMC(e.target.value); setFilterScheme(""); }}
          className="border rounded px-3 py-2"
        >
          <option value="">All AMCs</option>
          {amcs.map(amc => (
            <option key={amc} value={amc}>{amc}</option>
          ))}
        </select>

        <select
          value={filterScheme}
          onChange={e => setFilterScheme(e.target.value)}
          className="border rounded px-3 py-2"
          disabled={!filterAMC}
        >
          <option value="">All Schemes</option>
          {schemesByAMC.map(scheme => (
            <option key={scheme} value={scheme}>{scheme}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by folio number or investor"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <table className="w-full border rounded shadow bg-white overflow-x-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Folio Number</th>
            <th className="p-2 border">Investor Name</th>
            <th className="p-2 border">AMC</th>
            <th className="p-2 border">Scheme</th>
            <th className="p-2 border">Holdings</th>
            <th className="p-2 border">NAV</th>
            <th className="p-2 border">Market Value (₹)</th>
            <th className="p-2 border">Last Transaction Date</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredFolios.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-4 text-center text-gray-500">No folio details found.</td>
            </tr>
          ) : (
            filteredFolios.map(folio => (
              <tr key={folio.folioNumber} className="hover:bg-gray-50">
                <td className="p-2 border">{folio.folioNumber}</td>
                <td className="p-2 border">{folio.investorName}</td>
                <td className="p-2 border">{folio.amc}</td>
                <td className="p-2 border">{folio.scheme}</td>
                <td className="p-2 border">{folio.holdings.toLocaleString()}</td>
                <td className="p-2 border">{folio.nav.toFixed(2)}</td>
                <td className="p-2 border">{folio.marketValue.toLocaleString()}</td>
                <td className="p-2 border">{folio.lastTransactionDate}</td>
                <td className={`p-2 border font-semibold ${folio.status === "Active" ? "text-green-600" : "text-red-600"}`}>
                  {folio.status}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
