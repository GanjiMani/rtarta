import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

// Map of scheme name to scheme id
const schemeIdMap = {
  "ABC Equity Fund": "S001",
  "XYZ Debt Fund": "S002",
  "Balanced Advantage": "S003",
  "Tax Saver ELSS": "S004",
};

// Reverse map scheme id to name
const schemeIdToName = Object.entries(schemeIdMap).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {});

export default function SwitchSetup({ addTransaction = () => {} }) {
  const { token } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    sourceScheme: "",
    targetScheme: "",
    amount: "",
  });

  // Fetch holdings on component mount
  useEffect(() => {
    async function fetchHoldings() {
      try {
        const response = await fetch("http://localhost:8000/investor/investor/schemes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch holdings");
        const data = await response.json();
        setHoldings(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchHoldings();
  }, [token]);

  // Map holdings scheme_ids to scheme names for dropdown
  const uniqueSchemes = [
    ...new Set(
      holdings
        .map((holding) => schemeIdToName[holding.scheme_id])
        .filter((name) => Boolean(name))
    ),
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { sourceScheme, targetScheme, amount } = form;
    if (!sourceScheme || !targetScheme || !amount) {
      setError("Please fill all required fields");
      return;
    }
    if (sourceScheme === targetScheme) {
      setError("Source and target scheme cannot be the same");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const sourceSchemeId = schemeIdMap[sourceScheme];
      const sourceHolding = holdings.find((h) => h.scheme_id === sourceSchemeId);
      if (!sourceHolding) {
        setError("Source scheme holding not found");
        setLoading(false);
        return;
      }

      const payload = {
        from_scheme_id: sourceSchemeId,
        to_scheme_id: schemeIdMap[targetScheme],
        folio_number: sourceHolding.folio_number,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
      };

      const response = await fetch("http://localhost:8000/investor/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Switch setup failed");
      }
      const data = await response.json();

      addTransaction({
        id: data.redemption_txn_id,
        date: payload.date,
        type: "Switch Redemption",
        scheme: sourceScheme,
        amount: payload.amount,
        units: -parseFloat((payload.amount / (sourceHolding.nav || 1)).toFixed(4)),
        status: "Pending Payment",
      });

      const targetSchemeId = schemeIdMap[targetScheme];
      const targetHolding = holdings.find((h) => h.scheme_id === targetSchemeId);

      addTransaction({
        id: data.purchase_txn_id,
        date: payload.date,
        type: "Switch Purchase",
        scheme: targetScheme,
        amount: payload.amount,
        units: parseFloat(
          (payload.amount / (targetHolding?.nav || 1)).toFixed(4)
        ),
        status: "Pending Payment",
      });

      setSuccessMessage("Switch Setup successful ✅");
      setForm({ sourceScheme: "", targetScheme: "", amount: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading holdings...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="card max-w-lg mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Switch Transaction</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <select
          name="sourceScheme"
          onChange={handleChange}
          value={form.sourceScheme}
          className="border px-3 py-2 rounded"
          required
        >
          <option value="">-- Select Source Scheme --</option>
          {uniqueSchemes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          name="targetScheme"
          onChange={handleChange}
          value={form.targetScheme}
          className="border px-3 py-2 rounded"
          required
        >
          <option value="">-- Select Target Scheme --</option>
          {uniqueSchemes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          min="1"
          name="amount"
          placeholder="Enter Amount (₹)"
          value={form.amount}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing..." : "Submit Switch Request"}
        </button>

        {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
      </form>
    </div>
  );
}
