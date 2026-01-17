import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { ShieldAlert, Plus, ArrowLeft, ChevronRight, X, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

const complaintCategories = [
  { id: "transaction", label: "Transaction Related" },
  { id: "service", label: "Service Request" },
  { id: "account", label: "Account Access" },
  { id: "technical", label: "Technical Issue" },
  { id: "other", label: "General Inquiry" },
];

export default function InvestorComplaints() {
  const { fetchWithAuth } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [form, setForm] = useState({ subject: "", description: "", category: "transaction" });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (fetchWithAuth) fetchComplaints(); }, [fetchWithAuth]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/complaints`);
      if (res.ok) setComplaints((await res.json()).data || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/complaints`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setComplaints([result.data, ...complaints]);
      setSuccessMsg("Complaint registered."); setTimeout(() => setSuccessMsg(""), 3000);
      setShowModal(false); setForm({ subject: "", description: "", category: "transaction" });
    } catch (err) { setError("Submission failed"); } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Complaints</h1>
            <p className="text-gray-500 text-sm">Track & resolve grievances.</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> New Complaint</button>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-2 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Total", v: complaints.length },
          { l: "Open", v: complaints.filter(c => c.status === "open").length },
          { l: "In Progress", v: complaints.filter(c => c.status === "in_progress").length },
          { l: "Resolved", v: complaints.filter(c => c.status === "resolved").length },
        ].map((s, i) => (
          <div key={i} className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <div className="text-2xl font-bold text-gray-900">{s.v}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">{s.l}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
        <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complaints.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">#{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">{c.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{complaintCategories.find(Cat => Cat.id === c.category)?.label}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${c.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : c.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{c.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedComplaint(c)} className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end ml-auto gap-1">Details <ChevronRight size={14} /></button>
                  </td>
                </tr>
              ))}
              {!complaints.length && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No complaints found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* New Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Lodge Complaint</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {complaintCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief subject" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" rows="4" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description..."></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? "Submitting..." : "Submit Complaint"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Details View */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Case #{selectedComplaint.id}</h2>
                <p className="text-sm text-gray-500">{new Date(selectedComplaint.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
                <span className={`px-2 py-1 rounded text-xs font-bold border capitalize ${selectedComplaint.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{selectedComplaint.status.replace('_', ' ')}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Issue</label>
                <h3 className="font-bold text-gray-900 mb-1">{selectedComplaint.subject}</h3>
                <p className="text-sm text-gray-700">{selectedComplaint.description}</p>
              </div>
              {selectedComplaint.resolution_comments && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <label className="block text-xs font-medium text-green-700 uppercase mb-2">Resolution</label>
                  <p className="text-sm text-green-800">{selectedComplaint.resolution_comments}</p>
                  <div className="mt-2 text-xs text-green-600">Resolved: {new Date(selectedComplaint.resolved_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
