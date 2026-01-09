import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

export default function SIPSetup({ addSIP }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    scheme: "",
    amount: "",
    frequency: "Monthly",
    startDate: "",
    endDate: "",
    installments: "",
    bank: "",
    mandate: "UPI",
  });
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [sips, setSIPs] = useState([]);

  const dummySchemes = [
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
  const schemeIdMap = {
    "ABC Equity Fund": "S001",
    "XYZ Debt Fund": "S002",
    "Balanced Advantage": "S003",
    "Tax Saver ELSS": "S004",
  };

  // Fetch active SIPs on mount
  useEffect(() => {
    async function fetchSIPs() {
      try {
        const res = await fetch("http://localhost:8000/investor/sip/active", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch active SIPs");
        }
        const data = await res.json();
        setSIPs(data);
      } catch (err) {
        console.error("Error fetching SIPs:", err.message);
      }
    }
    fetchSIPs();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.scheme || !form.amount || !form.startDate || !form.bank) {
      setError("Please fill all required fields marked *");
      return;
    }
    setShowReview(true);
  };

  const handleConfirm = async () => {
    setShowReview(false);
    setError("");

    const scheme_id = schemeIdMap[form.scheme];

    const sipPayload = {
      scheme_id,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      start_date: form.startDate,
      end_date: form.endDate || null,
      installments: form.installments ? parseInt(form.installments) : null,
      bank: form.bank,
      mandate: form.mandate,
    };

    try {
      const response = await fetch("http://localhost:8000/investor/sip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sipPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "SIP setup failed");
      }

      const sipRes = await response.json();

      if (addSIP) addSIP(sipRes);
      setSIPs([sipRes, ...sips]);
      setForm({
        scheme: "",
        amount: "",
        frequency: "Monthly",
        startDate: "",
        endDate: "",
        installments: "",
        bank: "",
        mandate: "UPI",
      });
      setError("");
      alert("SIP Setup successful ✅");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (sipId) => {
    setSIPs((prev) => prev.filter((s) => s.reg_id !== sipId && s.id !== sipId));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">SIP Setup</h2>
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">
              Select Scheme <span className="text-red-500">*</span>
            </label>
            <select
              name="scheme"
              className="w-full border px-3 py-2 rounded"
              value={form.scheme}
              onChange={handleChange}
            >
              <option value="">--Select Scheme--</option>
              {dummySchemes.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              name="amount"
              type="number"
              min="100"
              step="100"
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
              <label className="block mb-1 font-medium">
                Start Date <span className="text-red-500">*</span>
              </label>
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
              className="w-full border px-3 py-2 rounded"
              value={form.installments}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Select Bank <span className="text-red-500">*</span>
            </label>
            <select
              name="bank"
              className="w-full border px-3 py-2 rounded"
              value={form.bank}
              onChange={handleChange}
            >
              <option value="">--Select Bank--</option>
              {dummyBanks.map((b, i) => (
                <option key={i} value={b}>
                  {b}
                </option>
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
            <h3 className="text-xl font-bold mb-4">Review SIP Setup</h3>
            <p>
              <strong>Scheme:</strong> {form.scheme}
            </p>
            <p>
              <strong>Amount:</strong> ₹{form.amount}
            </p>
            <p>
              <strong>Frequency:</strong> {form.frequency}
            </p>
            <p>
              <strong>Start Date:</strong> {form.startDate}
            </p>
            {form.endDate && (
              <p>
                <strong>End Date:</strong> {form.endDate}
              </p>
            )}
            {form.installments && (
              <p>
                <strong>Installments:</strong> {form.installments}
              </p>
            )}
            <p>
              <strong>Bank:</strong> {form.bank}
            </p>
            <p>
              <strong>Mandate:</strong> {form.mandate}
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mt-8">
        <h3 className="text-lg font-bold mb-4">Your Active SIPs</h3>
        {sips.length === 0 ? (
          <p className="text-gray-500">No SIPs yet. Set up your first SIP above!</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Scheme</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Start Date</th>
                <th className="p-2 border">Frequency</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border"></th>
              </tr>
            </thead>
            <tbody>
              {sips.map((sip) => (
                <tr key={sip.reg_id || sip.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{sip.scheme_id || sip.scheme}</td>
                  <td className="p-2 border">₹{sip.amount}</td>
                  <td className="p-2 border">{sip.start_date || sip.date}</td>
                  <td className="p-2 border">{sip.frequency}</td>
                  <td className="p-2 border">{sip.status}</td>
                  <td className="p-2 border">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(sip.reg_id || sip.id)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
