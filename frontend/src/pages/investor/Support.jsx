import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { LifeBuoy, Plus, ChevronRight, X, ArrowLeft, CheckCircle, AlertCircle, MessageSquare, Phone, Mail, HelpCircle } from "lucide-react";

export default function Support() {
  const { fetchWithAuth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState({ subject: "", message: "", priority: "medium" });
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (fetchWithAuth) fetchTickets(); }, [fetchWithAuth]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/support/tickets`);
      if (res.ok) setTickets((await res.json()).data || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/support/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setTickets([result.data, ...tickets]);
      setSuccessMsg("Ticket created!"); setTimeout(() => setSuccessMsg(""), 3000);
      setShowModal(false); setForm({ subject: "", message: "", priority: "medium" });
    } catch (err) { setError("Failed to create ticket"); } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support</h1>
            <p className="text-gray-500 text-sm">Help Center & Tickets.</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> New Ticket</button>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-2 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? <div className="p-8 text-center text-gray-500">Loading tickets...</div> : (
            <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-500">#{t.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs ">{t.subject}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${t.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{t.status?.replace('_', ' ')}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedTicket(t)} className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end ml-auto gap-1">View <ChevronRight size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {!tickets.length && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No support tickets.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><HelpCircle size={18} /> Quick Contact</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Mail size={16} className="text-blue-600" /> <span>support@rtarta.com</span></div>
              <div className="flex items-center gap-2"><Phone size={16} className="text-blue-600" /> <span>1800-456-7890</span></div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Issue summary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" rows="4" required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Detailed description..."></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? "Submitting..." : "Submit Ticket"}</button>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ticket #{selectedTicket.id}</h2>
                <p className="text-sm text-gray-500">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedTicket.message}</p>
              </div>
              {selectedTicket.resolution_notes && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <label className="block text-xs font-medium text-green-700 uppercase mb-2">Resolution</label>
                  <p className="text-sm text-green-800">{selectedTicket.resolution_notes}</p>
                  <div className="mt-2 text-xs text-green-600">Closed: {new Date(selectedTicket.resolved_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
