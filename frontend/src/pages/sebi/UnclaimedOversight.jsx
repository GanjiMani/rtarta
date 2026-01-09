// File: src/pages/sebi/UnclaimedOversight.jsx
import React, { useState } from "react";

// Dummy ageing summary data
const ageingSummary = [
  { bucket: "< 1 Year", amount: 2.5 },
  { bucket: "1 - 3 Years", amount: 1.0 },
  { bucket: "> 3 Years", amount: 0.5 },
];

// Dummy detailed data for drill-down
const drillDownData = [
  {
    rta: "RTA One",
    amc: "Visionary Mutual Fund",
    folio: "F001",
    amount: 0.8,
    bucket: "< 1 Year",
  },
  {
    rta: "RTA One",
    amc: "Progressive AMC",
    folio: "F002",
    amount: 1.2,
    bucket: "1 - 3 Years",
  },
  {
    rta: "RTA Two",
    amc: "Horizon Fund House",
    folio: "F003",
    amount: 0.5,
    bucket: "> 3 Years",
  },
];

export default function UnclaimedOversight() {
  const [selectedRTA, setSelectedRTA] = useState("");
  const [notes, setNotes] = useState("");
  const [supervisoryNotes, setSupervisoryNotes] = useState([]);

  const uniqueRTAs = [...new Set(drillDownData.map((d) => d.rta))];

  const filteredData = selectedRTA
    ? drillDownData.filter((d) => d.rta === selectedRTA)
    : drillDownData;

  const handleAddNote = () => {
    if (selectedRTA && notes.trim()) {
      setSupervisoryNotes((prev) => [
        ...prev,
        { rta: selectedRTA, note: notes },
      ]);
      setNotes("");
      alert(`Supervisory note added for ${selectedRTA}`);
    } else {
      alert("Select an RTA and enter notes before submitting.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-red-700 mb-6">
        Unclaimed Oversight
      </h1>

      {/* Ageing Summary */}
      <section className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-700">
          Unclaimed Amounts Ageing Summary (₹ Crores)
        </h2>
        <div className="flex gap-6 justify-center">
          {ageingSummary.map(({ bucket, amount }) => (
            <div
              key={bucket}
              className="border rounded shadow p-4 flex flex-col items-center w-32"
            >
              <span className="text-2xl font-bold text-red-600">{amount}</span>
              <span className="text-gray-600 mt-1 text-center">{bucket}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Drill-down Filter */}
      <section className="bg-white shadow rounded p-6">
        <label
          htmlFor="rtaSelect"
          className="block mb-2 font-medium text-gray-700"
        >
          Filter by RTA
        </label>
        <select
          id="rtaSelect"
          value={selectedRTA}
          onChange={(e) => setSelectedRTA(e.target.value)}
          className="border p-2 rounded mb-4 max-w-xs"
        >
          <option value="">All RTAs</option>
          {uniqueRTAs.map((rta) => (
            <option key={rta} value={rta}>
              {rta}
            </option>
          ))}
        </select>

        {/* Drill-down Table */}
        <table className="w-full border-collapse text-left">
          <thead className="bg-red-100 text-red-700 font-semibold">
            <tr>
              <th className="p-3 border">RTA</th>
              <th className="p-3 border">AMC</th>
              <th className="p-3 border">Folio</th>
              <th className="p-3 border">Amount (₹ Crores)</th>
              <th className="p-3 border">Ageing Bucket</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map(({ rta, amc, folio, amount, bucket }, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-red-50" : "bg-white"}
                >
                  <td className="p-3 border">{rta}</td>
                  <td className="p-3 border">{amc}</td>
                  <td className="p-3 border">{folio}</td>
                  <td className="p-3 border">{amount.toFixed(2)}</td>
                  <td className="p-3 border">{bucket}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-3 border text-center text-gray-500"
                >
                  No unclaimed funds entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Supervisory Notes */}
      <section className="bg-white shadow rounded p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-red-700">
          Trigger Supervisory Notes to RTA
        </h2>
        <div className="flex flex-col mb-4">
          <label htmlFor="noteRTA" className="mb-2 font-medium">
            Select RTA
          </label>
          <select
            id="noteRTA"
            value={selectedRTA}
            onChange={(e) => setSelectedRTA(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">-- Select an RTA --</option>
            {uniqueRTAs.map((rta) => (
              <option key={rta} value={rta}>
                {rta}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col mb-4">
          <label htmlFor="noteText" className="mb-2 font-medium">
            Note / Instruction
          </label>
          <textarea
            id="noteText"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="border p-2 rounded resize-none"
            placeholder="Enter supervisory note for the selected RTA"
          ></textarea>
        </div>
        <button
          onClick={handleAddNote}
          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition"
        >
          Submit Note
        </button>

        {supervisoryNotes.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-red-700 mb-2">Submitted Notices</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {supervisoryNotes.map(({ rta, note }, idx) => (
                <li key={idx}>
                  <strong>{rta}:</strong> {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
