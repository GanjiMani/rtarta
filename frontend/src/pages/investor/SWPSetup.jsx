import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";

export default function SWPSetup({ addSWP }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    scheme: "",
    mode: "Amount",
    amount: "",
    frequency: "Monthly",
    startDate: "",
    endDate: "",
    bank: "",
    mandate: "UPI",
    installments: "",
  });

  const dummySchemes = ["ABC Equity Fund", "XYZ Debt Fund", "Balanced Advantage", "Tax Saver ELSS"];
  const dummyBanks = ["HDFC Bank - XXXX1234", "ICICI Bank - XXXX5678", "SBI Bank - XXXX9999"];
  const schemeIdMap = {
    "ABC Equity Fund": "S001",
    "XYZ Debt Fund": "S002",
    "Balanced Advantage": "S003",
    "Tax Saver ELSS": "S004",
  };

  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.scheme || !form.amount || !form.startDate || !form.bank) {
      setError("Please fill all required fields");
      return;
    }
    setShowReview(true);
  };

  const handleConfirm = async () => {
    setShowReview(false);
    setError("");
    const scheme_id = schemeIdMap[form.scheme];

    const swpPayload = {
      scheme_id,
      frequency: form.frequency,
      start_date: form.startDate,
      end_date: form.endDate ? form.endDate : null,
      installments: form.installments ? parseInt(form.installments) : null,
      bank: form.bank,
      mandate: form.mandate,
    };

    if (form.mode === "Amount") {
      swpPayload.amount = parseFloat(form.amount);
    } else {
      swpPayload.units = parseFloat(form.amount);
    }

    try {
      const response = await fetch("http://localhost:8000/investor/swp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(swpPayload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "SWP setup failed");
      }
      const swpRes = await response.json();
      if (addSWP) addSWP(swpRes);
      setForm({
        scheme: "",
        mode: "Amount",
        amount: "",
        frequency: "Monthly",
        startDate: "",
        endDate: "",
        bank: "",
        mandate: "UPI",
        installments: "",
      });
      setError("");
      alert("SWP Setup successful ✅");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (swpId) => {
    if (addSWP) addSWP((prev) => prev.filter((s) => s.reg_id !== swpId));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">SWP Setup</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Select Scheme</label>
            <select
              name="scheme"
              className="w-full border px-3 py-2 rounded"
              value={form.scheme}
              onChange={handleChange}
            >
              <option value="">--Select Scheme--</option>
              {dummySchemes.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Withdrawal Mode</label>
            <select
              name="mode"
              className="w-full border px-3 py-2 rounded"
              value={form.mode}
              onChange={handleChange}
            >
              <option>Amount</option>
              <option>Units</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">{form.mode === "Amount" ? "Withdrawal Amount (₹)" : "Withdrawal Units"}</label>
            <input
              name="amount"
              type="number"
              className="w-full border px-3 py-2 rounded"
              value={form.amount}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Frequency</label>
            <select
              name="frequency"
              className="w-full border px-3 py-2 rounded"
              value={form.frequency}
              onChange={handleChange}
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Start Date</label>
              <input
                name="startDate"
                type="date"
                className="w-full border px-3 py-2 rounded"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">End Date (Optional)</label>
              <input
                name="endDate"
                type="date"
                className="w-full border px-3 py-2 rounded"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">No. of Installments (Optional)</label>
            <input
              name="installments"
              type="number"
              min="1"
              className="w-full border px-3 py-2 rounded"
              value={form.installments}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Select Bank</label>
            <select
              name="bank"
              className="w-full border px-3 py-2 rounded"
              value={form.bank}
              onChange={handleChange}
            >
              <option value="">--Select Bank--</option>
              {dummyBanks.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Mandate Type</label>
            <select
              name="mandate"
              className="w-full border px-3 py-2 rounded"
              value={form.mandate}
              onChange={handleChange}
            >
              <option value="UPI">UPI Mandate</option>
              <option value="ECS">ECS Mandate</option>
              <option value="NetBanking">Net Banking Auto-Debit</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </form>
      </div>
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Review SWP Setup</h3>
            <p><strong>Scheme:</strong> {form.scheme}</p>
            <p><strong>Withdrawal Mode:</strong> {form.mode}</p>
            <p><strong>Amount:</strong> ₹{form.amount}</p>
            <p><strong>Frequency:</strong> {form.frequency}</p>
            <p><strong>Start Date:</strong> {form.startDate}</p>
            {form.endDate && <p><strong>End Date:</strong> {form.endDate}</p>}
            <p><strong>Bank:</strong> {form.bank}</p>
            <p><strong>Mandate:</strong> {form.mandate}</p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
