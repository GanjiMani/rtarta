import React, { useState } from "react";

// Sample investor data with AMC and Scheme association
const dummyInvestors = [
  { id: "I001", name: "Rohan Sharma", pan: "ABCDE1234F", city: "Mumbai", kycStatus: "Verified", AMC_Name: "HDFC AMC", Scheme_Name: "HDFC Equity Fund" },
  { id: "I002", name: "Priya Singh", pan: "FGHIJ5678K", city: "Delhi", kycStatus: "Verified", AMC_Name: "HDFC AMC", Scheme_Name: "HDFC Balanced Fund" },
  { id: "I003", name: "Alok Kumar", pan: "KLMNO9012P", city: "Bengaluru", kycStatus: "Pending", AMC_Name: "Jio AMC", Scheme_Name: "Jio Growth Fund" },
  // Add more sample investors as needed
];

export default function InvestorProfile({ userAMC = "HDFC AMC" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");

  // Extract list of schemes for the logged-in AMC for filter dropdown
  const schemes = [...new Set(dummyInvestors.filter(inv => inv.AMC_Name === userAMC).map(inv => inv.Scheme_Name))];

  // Filter investors by AMC, scheme filter, and search term
  const filtered = dummyInvestors.filter(inv =>
    inv.AMC_Name === userAMC && // restrict investors to user's AMC only
    (schemeFilter === "" || inv.Scheme_Name === schemeFilter) &&
    (inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inv.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inv.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Investor Profiles - {userAMC}</h1>

      <div className="mb-4 flex space-x-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, PAN or city"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-md max-w-md flex-grow"
        />
        <select
          value={schemeFilter}
          onChange={(e) => setSchemeFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Schemes</option>
          {schemes.map(sch => (
            <option key={sch} value={sch}>{sch}</option>
          ))}
        </select>
      </div>

      <table className="w-full border rounded shadow bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Investor ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">PAN</th>
            <th className="p-2 border">City</th>
            <th className="p-2 border">Scheme</th>
            <th className="p-2 border">KYC Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length ? (
            filtered.map(({ id, name, pan, city, kycStatus, Scheme_Name }) => (
              <tr key={id}>
                <td className="p-2 border">{id}</td>
                <td className="p-2 border">{name}</td>
                <td className="p-2 border">{pan}</td>
                <td className="p-2 border">{city}</td>
                <td className="p-2 border">{Scheme_Name}</td>
                <td className={`p-2 border font-semibold ${kycStatus === "Verified" ? "text-green-600" : "text-red-600"}`}>
                  {kycStatus}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">No matching investors found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
