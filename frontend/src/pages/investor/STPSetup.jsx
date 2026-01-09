import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

function STPSetup({ addTransaction = () => {} }) {
  const { token } = useAuth();

  const [holdings, setHoldings] = useState([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [holdingsError, setHoldingsError] = useState(null);

  const [form, setForm] = useState({
    fromScheme: "",
    toScheme: "",
    mode: "Amount",
    value: "",
    date: "",
  });

  const allSchemes = [
    "ABC Equity Fund",
    "XYZ Debt Fund",
    "Balanced Advantage",
    "Tax Saver ELSS",
  ];

  const schemeIdMap = {
    "ABC Equity Fund": "S001",
    "XYZ Debt Fund": "S002",
    "Balanced Advantage": "S003",
    "Tax Saver ELSS": "S004",
  };

  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch holdings on mount
  useEffect(() => {
    async function fetchHoldings() {
      setLoadingHoldings(true);
      setHoldingsError(null);
      try {
        // Update API URL as needed
        const response = await fetch("http://localhost:8000/investor/investor/schemes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch holdings");
        }
        const data = await response.json();
        console.log("Fetched holdings:", data);
        setHoldings(data);
      } catch (err) {
        console.error("Error fetching holdings:", err);
        setHoldingsError(err.message);
        setHoldings([]);
      } finally {
        setLoadingHoldings(false);
      }
    }
    fetchHoldings();
  }, [token]);

  const findHoldingBySchemeName = (schemeName) => {
    const schemeId = schemeIdMap[schemeName];
    return holdings.find((h) => h.scheme_id === schemeId);
  };

  const getUnits = (schemeName, amount) => {
    const schemeHolding = findHoldingBySchemeName(schemeName);
    const nav = schemeHolding?.nav || 1;
    return parseFloat((amount / nav).toFixed(4));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fromScheme || !form.toScheme || !form.value || !form.date) {
      setError("Please fill all required fields");
      return;
    }
    if (form.fromScheme === form.toScheme) {
      setError("From Scheme and To Scheme cannot be the same");
      return;
    }
    let fromHolding = findHoldingBySchemeName(form.fromScheme);
    if (!fromHolding) {
      setError("No holdings found for source scheme");
      return;
    }
    if (fromHolding.units <= 0) {
      setError("Source scheme has zero units");
      return;
    }
    if (form.mode === "Amount" && parseFloat(form.value) <= 0) {
      setError("Amount must be greater than zero");
      return;
    }
    if (form.mode === "Amount" && parseFloat(form.value) > fromHolding.value) {
      setError("Amount cannot exceed source scheme value");
      return;
    }
    if (form.mode === "Units" && parseFloat(form.value) <= 0) {
      setError("Units must be greater than zero");
      return;
    }
    if (form.mode === "Units" && parseFloat(form.value) > fromHolding.units) {
      setError("Units cannot exceed source scheme units");
      return;
    }
    setShowPreview(true);
    setError("");
  };

  const handleConfirm = async () => {
    setShowPreview(false);
    setError("");
    setSuccessMessage("");

    const payload = {
      from_scheme_id: schemeIdMap[form.fromScheme],
      to_scheme_id: schemeIdMap[form.toScheme],
      date: new Date(form.date).toISOString(),
    };
    const val = parseFloat(form.value);
    if (form.mode === "Amount") {
      payload.amount = val;
    } else {
      payload.units = val;
    }

    try {
      const response = await fetch("http://localhost:8000/investor/stp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "STP setup failed");
      }
      const data = await response.json();

      addTransaction({
        id: data.redemption_txn_id,
        date: form.date,
        type: "STP Redemption",
        scheme: form.fromScheme,
        amount:
          form.mode === "Amount"
            ? val
            : val * (findHoldingBySchemeName(form.fromScheme)?.nav || 1),
        units: form.mode === "Units" ? -val : -getUnits(form.fromScheme, val),
        status: "Pending Payment",
      });
      addTransaction({
        id: data.purchase_txn_id,
        date: form.date,
        type: "STP Purchase",
        scheme: form.toScheme,
        amount:
          form.mode === "Amount"
            ? val
            : val * (findHoldingBySchemeName(form.toScheme)?.nav || 1),
        units: form.mode === "Units" ? val : getUnits(form.toScheme, val),
        status: "Pending Payment",
      });

      setForm({ fromScheme: "", toScheme: "", mode: "Amount", value: "", date: "" });
      setSuccessMessage("STP Setup successful ✅");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loadingHoldings) return <p>Loading holdings...</p>;
  if (holdingsError) return <p className="text-red-600">Error: {holdingsError}</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">STP Setup</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">From Scheme</label>
            <select
              name="fromScheme"
              className="w-full border px-3 py-2 rounded"
              value={form.fromScheme}
              onChange={handleChange}
            >
              <option value="">--Select Scheme--</option>
              {allSchemes.map((scheme) => (
                <option key={scheme} value={scheme}>
                  {scheme}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">To Scheme</label>
            <select
              name="toScheme"
              className="w-full border px-3 py-2 rounded"
              value={form.toScheme}
              onChange={handleChange}
            >
              <option value="">--Select Scheme--</option>
              {allSchemes.map((scheme) => (
                <option key={scheme} value={scheme}>
                  {scheme}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Mode</label>
            <select
              name="mode"
              className="w-full border px-3 py-2 rounded"
              value={form.mode}
              onChange={handleChange}
            >
              <option value="Amount">Amount</option>
              <option value="Units">Units</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">{form.mode}</label>
            <input
              name="value"
              type="number"
              min={form.mode === "Amount" ? "0.01" : "0.001"}
              step={form.mode === "Amount" ? "0.01" : "0.001"}
              className="w-full border px-3 py-2 rounded"
              value={form.value}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input
              name="date"
              type="date"
              className="w-full border px-3 py-2 rounded"
              value={form.date}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Preview STP
          </button>
        </form>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">STP Preview</h3>
            <table className="w-full mb-4 text-left border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Scheme</th>
                  <th className="p-2 border">Units</th>
                  <th className="p-2 border">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">Redemption</td>
                  <td className="p-2 border">{form.fromScheme}</td>
                  <td className="p-2 border">
                    {form.mode === "Units" ? form.value : getUnits(form.fromScheme, form.value)}
                  </td>
                  <td className="p-2 border">
                    {form.mode === "Amount"
                      ? form.value
                      : (form.value * (findHoldingBySchemeName(form.fromScheme)?.nav || 1)).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border">Purchase</td>
                  <td className="p-2 border">{form.toScheme}</td>
                  <td className="p-2 border">
                    {form.mode === "Units" ? form.value : getUnits(form.toScheme, form.value)}
                  </td>
                  <td className="p-2 border">
                    {form.mode === "Amount"
                      ? form.value
                      : (form.value * (findHoldingBySchemeName(form.toScheme)?.nav || 1)).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm STP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default STPSetup;

