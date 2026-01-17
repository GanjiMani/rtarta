import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { Users, CheckCircle, Edit2, Trash2, Plus, AlertCircle, ArrowLeft } from "lucide-react";

export default function NomineeManagement() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editIndex, setEditIndex] = useState(-1);
  const [nominees, setNominees] = useState([]);

  useEffect(() => { if (fetchWithAuth) fetchNominees(); }, [fetchWithAuth]);

  const fetchNominees = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setNominees(data.data?.nominees || []);
    } catch (err) { setError("Failed to load nominees"); } finally { setLoading(false); }
  };

  const saveNominee = async (index) => {
    try {
      const n = nominees[index];
      const isNew = !n.id;
      const res = await fetchWithAuth(isNew ? "/api/investor/profile/nominees" : `/api/investor/profile/nominees/${n.id}`, {
        method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...n, allocation_percentage: parseFloat(n.allocation_percentage || n.pct || 100) }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg(isNew ? "Added!" : "Updated!"); setTimeout(() => setSuccessMsg(""), 3000);
      setEditIndex(-1); fetchNominees();
    } catch (err) { setError("Save failed"); }
  };

  const deleteNominee = async (index) => {
    if (!window.confirm("Delete nominee?")) return;
    try {
      const n = nominees[index];
      if (n.id) await fetchWithAuth(`/api/investor/profile/nominees/${n.id}`, { method: "DELETE" });
      fetchNominees();
    } catch (err) { setError("Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nominees</h1>
            <p className="text-gray-500 text-sm">Manage beneficiaries for your investments.</p>
          </div>
        </div>
        <button onClick={() => { setNominees([...nominees, { allocation_percentage: 100 }]); setEditIndex(nominees.length); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> Add Nominee</button>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-2 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nominees.map((n, i) => (
            <div key={i} className={`border border-gray-100 rounded-lg p-4 shadow-sm ${editIndex === i ? 'ring-2 ring-blue-500' : ''}`}>
              {editIndex === i ? (
                <div className="space-y-3">
                  <input className="w-full p-2 border border-gray-200 rounded text-sm" placeholder="Nominee Name" value={n.nominee_name || n.name || ""} onChange={e => { const x = [...nominees]; x[i].nominee_name = e.target.value; setNominees(x) }} />
                  <select className="w-full p-2 border border-gray-200 rounded text-sm" value={n.relationship || ""} onChange={e => { const x = [...nominees]; x[i].relationship = e.target.value; setNominees(x) }}>
                    <option value="">Relationship</option>
                    {["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="date" className="w-full p-2 border border-gray-200 rounded text-sm" value={n.date_of_birth || ""} onChange={e => { const x = [...nominees]; x[i].date_of_birth = e.target.value; setNominees(x) }} />
                  <input className="w-full p-2 border border-gray-200 rounded text-sm" type="number" placeholder="Allocation %" value={n.allocation_percentage || n.pct || 100} onChange={e => { const x = [...nominees]; x[i].allocation_percentage = e.target.value; setNominees(x) }} />
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => { setEditIndex(-1); fetchNominees() }} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-xs">Cancel</button>
                    <button onClick={() => saveNominee(i)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs">Save</button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{n.nominee_name || n.name || "New Nominee"}</div>
                      <div className="text-xs text-gray-500">{n.relationship}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{n.allocation_percentage || n.pct}%</div>
                      <div className="text-[10px] text-gray-400 uppercase">Share</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">DOB: {n.date_of_birth ? new Date(n.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                  <div className="flex gap-2 border-t border-gray-50 pt-3 justify-end">
                    <button onClick={() => setEditIndex(i)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                    <button onClick={() => deleteNominee(i)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!nominees.length && <div className="col-span-2 p-8 text-center text-gray-500 border border-gray-100 border-dashed rounded-lg">No nominees declared.</div>}
        </div>
      )}
    </div>
  );
}
