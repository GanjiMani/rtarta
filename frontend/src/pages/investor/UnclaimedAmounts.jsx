import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function UnclaimedAmounts() {
  const { fetchWithAuth } = useAuth();
  const [unclaimed, setUnclaimed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) fetchUnclaimed();
  }, [fetchWithAuth]);

  const fetchUnclaimed = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth("/api/investor/unclaimed");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setUnclaimed(data.data || []);
    } catch (err) { setError("Failed to load unclaimed amounts"); } finally { setLoading(false); }
  };

  const handleClaim = async (id, item) => {
    setClaimingId(id); setError(""); setSuccessMsg("");
    try {
      const response = await fetchWithAuth("/api/investor/unclaimed/claim", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unclaimed_id: id }),
      });
      if (!response.ok) throw new Error("Claim failed");
      setSuccessMsg(`Claim submitted for ₹${item.total_amount || item.amount}`);
      setTimeout(() => setSuccessMsg(""), 5000);
      await fetchUnclaimed();
    } catch (err) { setError(err.message || "Failed"); } finally { setClaimingId(null); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Unclaimed Amounts</h1>
            <p className="text-gray-500 text-sm">Track and claim pending dividends/redemptions.</p>
          </div>
        </div>
        <button onClick={fetchUnclaimed} className="p-2 text-gray-500 hover:bg-gray-50 rounded"><RefreshCw size={18} /></button>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded text-sm flex items-center gap-2"><CheckCircle size={16} /> {successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      {unclaimed.length > 0 ? (
        <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Scheme</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {unclaimed.map((item) => {
                const canClaim = !item.claimed && item.status === "Pending";
                const id = item.unclaimed_id || item.id;
                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">
                      {item.unclaimed_date ? new Date(item.unclaimed_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.scheme_name || item.scheme_id}
                      <div className="text-xs text-gray-400 font-normal">{item.folio_number}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{item.transaction_type?.replace(/_/g, " ") || "N/A"}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{Number(item.total_amount || item.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      {canClaim ? (
                        <button
                          onClick={() => handleClaim(id, item)}
                          disabled={claimingId === id}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {claimingId === id ? "..." : "Claim"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Claimed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center border border-gray-100 rounded-lg bg-gray-50 text-gray-500 text-sm">
          No unclaimed amounts found.
        </div>
      )}
    </div>
  );
}
