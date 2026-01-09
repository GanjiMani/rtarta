import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";

export default function Redemption() {
  const { token } = useAuth();
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    scheme: "",
    redemptionType: "amount",
    amount: "",
    units: "",
    bank: "",
    paymentMode: "",
  });

  const dummySchemes = ["S001", "S002", "S003", "S004"];
  const schemeLabels = [
    "ABC Equity Fund",
    "XYZ Debt Fund",
    "Balanced Advantage",
    "Tax Saver ELSS",
  ];
  const dummyBanks = [
    "HDFC Bank - XXXX1234",
    "ICICI Bank - XXXX5678",
    "SBI Bank - XXXX9999",
  ];
  const [showReview, setShowReview] = useState(false);

  // Dummy holdings (replace with actual API call in production)
  const dummyHoldings = dummySchemes.map((schemeId, idx) => ({
    scheme_id: schemeId,
    name: schemeLabels[idx],
    units: 100 * (idx + 1),
    nav: 100 + idx * 20,
    value: (100 + idx * 20) * 100 * (idx + 1),
  }));

  const selectedHolding = dummyHoldings.find(h => h.scheme_id === form.scheme);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg("");
    if (!form.scheme || !form.bank || !form.paymentMode) {
      alert("Please fill all required fields");
      return;
    }
    if (form.redemptionType === "amount" && (!form.amount || form.amount <= 0)) {
      alert("Enter valid redemption amount");
      return;
    }
    if (form.redemptionType === "units" && (!form.units || form.units <= 0)) {
      alert("Enter valid redemption units");
      return;
    }
    if (form.redemptionType === "all" && !selectedHolding) {
      alert("No holding available for this scheme");
      return;
    }
    setShowReview(true);
  };
const handleConfirm = async () => {
  setShowReview(false);
  if (!selectedHolding) return;

  // Initialize payload with always required fields
  const payload = {
    scheme_id: form.scheme,
    bank: form.bank,
    payment_mode: form.paymentMode,
  };

  // Add either amount or units based on redemption type
  if (form.redemptionType === "amount") {
    payload.amount = parseFloat(form.amount);
  } else if (form.redemptionType === "units") {
    payload.units = parseFloat(form.units);
  } else if (form.redemptionType === "all") {
    // For full redemption: no amount or units sent,
    // backend assumes full redemption if both missing
  }

  try {
    const res = await fetch("http://localhost:8000/investor/redemption", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Redemption failed");
    }
    const txn = await res.json();
    setSuccessMsg(
      `Redemption submitted! Scheme: ${txn.scheme_id} | Amount: ₹${txn.amount} | Status: ${txn.status}`
    );
  } catch (err) {
    setSuccessMsg("");
    alert("Error: " + err.message);
  }
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Redemption</h2>
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
          {successMsg}
        </div>
      )}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Select Scheme</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={form.scheme}
              onChange={(e) => setForm({ ...form, scheme: e.target.value })}
            >
              <option value="">--Select Scheme--</option>
              {dummySchemes.map((schemeId, idx) => (
                <option key={schemeId} value={schemeId}>
                  {schemeLabels[idx]}
                </option>
              ))}
            </select>
            {selectedHolding && (
              <p className="text-sm text-gray-500 mt-1">
                Units: {selectedHolding.units} | Value: ₹{selectedHolding.value} | NAV: ₹{selectedHolding.nav}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Redemption Type</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  name="redemptionType"
                  value="amount"
                  checked={form.redemptionType === "amount"}
                  onChange={(e) => setForm({ ...form, redemptionType: e.target.value })}
                />{" "}
                By Amount
              </label>
              <label>
                <input
                  type="radio"
                  name="redemptionType"
                  value="units"
                  checked={form.redemptionType === "units"}
                  onChange={(e) => setForm({ ...form, redemptionType: e.target.value })}
                />{" "}
                By Units
              </label>
              <label>
                <input
                  type="radio"
                  name="redemptionType"
                  value="all"
                  checked={form.redemptionType === "all"}
                  onChange={(e) => setForm({ ...form, redemptionType: e.target.value })}
                />{" "}
                Redeem All
              </label>
            </div>
          </div>
          {form.redemptionType === "amount" && (
            <div>
              <label className="block mb-1 font-medium">Amount (₹)</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          )}
          {form.redemptionType === "units" && (
            <div>
              <label className="block mb-1 font-medium">Units</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block mb-1 font-medium">Select Bank</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
            >
              <option value="">--Select Bank--</option>
              {dummyBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Payment Mode</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={form.paymentMode}
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
            >
              <option value="">--Select Payment Mode--</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Proceed
          </button>
        </form>
      </div>
      {showReview && selectedHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Review Redemption</h3>
            <p>
              <strong>Scheme:</strong> {schemeLabels[dummySchemes.indexOf(form.scheme)]}
            </p>
            <p>
              <strong>Type:</strong> {form.redemptionType}
            </p>
            {form.redemptionType === "amount" && (
              <p>
                <strong>Amount:</strong> ₹{form.amount}
              </p>
            )}
            {form.redemptionType === "units" && (
              <p>
                <strong>Units:</strong> {form.units}
              </p>
            )}
            {form.redemptionType === "all" && <p><strong>Full Redemption</strong></p>}
            <p>
              <strong>Bank:</strong> {form.bank}
            </p>
            <p>
              <strong>Payment Mode:</strong> {form.paymentMode}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
