import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { CheckCircle, AlertCircle, ArrowLeft, Plus } from "lucide-react";

export default function MandateManagement() {
  const { fetchWithAuth } = useAuth();
  const [mandates, setMandates] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [form, setForm] = useState({ scheme: "", type: "UPI" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fetchWithAuth) { fetchMandates(); fetchSchemes(); }
  }, [fetchWithAuth]);

  const fetchMandates = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/bank`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMandates(data.data || []);
    } catch (err) { setError("Failed to fetch mandates"); } finally { setLoading(false); }
  };

  const fetchSchemes = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/schemes");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setSchemes(data.data || data || []);
    } catch (err) { console.error(err); }
  };

  const register = async () => {
    if (!form.scheme) return setError("Please select a scheme");
    setError(""); setSuccessMsg("");
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/bank`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheme_id: form.scheme, mandate_type: form.type }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("Mandate registered!"); setTimeout(() => setSuccessMsg(""), 3000);
      setForm({ scheme: "", type: "UPI" }); fetchMandates();
    } catch (err) { setError("Register failed"); }
  };

  const activate = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/verify/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed");
      fetchMandates();
    } catch (err) { setError("Activation failed"); }
  };

  const revoke = async (id) => {
    if (!window.confirm("Revoke mandate?")) return;
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/bank/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      fetchMandates();
    } catch (err) { setError("Revocation failed"); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mandates</h1>
            <p className="text-gray-500 text-sm">Manage automated payment mandates.</p>
          </div>
        </div>
      </div>

      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="border border-gray-100 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Register New Mandate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scheme</label>
                <select value={form.scheme} onChange={(e) => setForm({ ...form, scheme: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="">-- Select --</option>
                  {schemes.map((s) => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="UPI">UPI</option>
                  <option value="ECS">ECS</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="debit_mandate">Debit Mandate</option>
                </select>
              </div>
              <button onClick={register} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2"><Plus size={16} /> Register</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading mandates...</div>
            ) : mandates.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No mandates found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr><th className="px-4 py-3">Bank</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Limit</th><th className="px-4 py-3 text-center">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mandates.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{m.bank_name}</div>
                        <div className="text-xs text-gray-400">****{m.account_number?.slice(-4)}</div>
                      </td>
                      <td className="px-4 py-3">{m.mandate_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${m.mandate_status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : m.mandate_status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-50 text-red-500'}`}>{m.mandate_status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">₹{m.mandate_limit?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center gap-2 flex justify-center">
                        {m.mandate_status?.toLowerCase() === 'inactive' && <button onClick={() => activate(m.id)} className="text-blue-600 hover:underline text-xs">Activate</button>}
                        {['active', 'pending'].includes(m.mandate_status?.toLowerCase()) && <button onClick={() => revoke(m.id)} className="text-red-600 hover:underline text-xs">Revoke</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
