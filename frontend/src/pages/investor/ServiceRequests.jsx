import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { FileText, Plus, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Clock, X, ChevronRight } from "lucide-react";

const requestTypes = [
  { id: "address_change", label: "Change of Address" },
  { id: "mobile_change", label: "Change of Mobile" },
  { id: "bank_update", label: "Bank Mandate Update" },
  { id: "kyc_update", label: "PAN/KYC Update" },
  { id: "statement_request", label: "Account Statement" },
  { id: "nominee_update", label: "Nominee Update" },
  { id: "other", label: "Other" },
];

export default function ServiceRequests() {
  const { fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState({ request_type: "address_change", description: "", priority: "medium" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (fetchWithAuth) fetchRequests(); }, [fetchWithAuth]);

  const fetchRequests = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/service-requests`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) { setError("Failed to load requests"); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return setError("Description required");
    setSubmitting(true); setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/service-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setRequests([result.data, ...requests]);
      setForm({ request_type: "address_change", description: "", priority: "medium" });
      setShowModal(false); setSuccessMsg("Request submitted!"); setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) { setError("Submission failed"); } finally { setSubmitting(false); }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm("Cancel request?")) return;
    try {
      await fetchWithAuth(`/api/investor/service-requests/${id}`, { method: "DELETE" });
      fetchRequests(); setShowDetails(false);
    } catch (err) { setError("Cancellation failed"); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Service Requests</h1>
            <p className="text-gray-500 text-sm">Raise and track service requests.</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> New Request</button>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-2 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Total", v: requests.length, c: "text-blue-600", bg: "bg-blue-50" },
          { l: "Pending", v: requests.filter(r => r.status === "pending").length, c: "text-amber-600", bg: "bg-amber-50" },
          { l: "In Progress", v: requests.filter(r => r.status === "in_progress").length, c: "text-indigo-600", bg: "bg-indigo-50" },
          { l: "Resolved", v: requests.filter(r => r.status === "resolved").length, c: "text-green-600", bg: "bg-green-50" },
        ].map((s, i) => (
          <div key={i} className="p-4 border border-gray-100 rounded-lg shadow-sm">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
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
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">#{r.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{requestTypes.find(t => t.id === r.request_type)?.label || r.request_type}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{r.priority}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${r.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : r.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : r.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.status?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setSelectedRequest(r); setShowDetails(true) }} className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 justify-end ml-auto">View <ChevronRight size={14} /></button>
                  </td>
                </tr>
              ))}
              {!requests.length && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No Service Requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Service Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Request Type</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" value={form.request_type} onChange={e => setForm({ ...form, request_type: e.target.value })}>
                  {requestTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" rows="4" placeholder="Describe your request..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? "Submitting..." : "Submit Request"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Request #{selectedRequest.id}</h2>
                <p className="text-sm text-gray-500">{requestTypes.find(t => t.id === selectedRequest.request_type)?.label}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
                <span className={`px-2 py-1 rounded text-xs font-bold border capitalize ${selectedRequest.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : selectedRequest.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{selectedRequest.status.replace('_', ' ')}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date</label>
                <div className="text-sm font-medium text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Description</label>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedRequest.description}</p>
              </div>
              {selectedRequest.resolution_comments && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <label className="block text-xs font-medium text-green-700 uppercase mb-2">Resolution</label>
                  <p className="text-sm text-green-800">{selectedRequest.resolution_comments}</p>
                </div>
              )}
              {selectedRequest.status === 'pending' && (
                <button onClick={() => cancelRequest(selectedRequest.id)} className="w-full py-2 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50">Cancel Request</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
