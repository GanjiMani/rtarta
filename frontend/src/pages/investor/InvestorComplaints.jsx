import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  ShieldAlert,
  Plus,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  X,
  Search,
  MessageSquare,
  FileText,
  LifeBuoy
} from "lucide-react";

const complaintCategories = [
  { id: "transaction", label: "Transaction Related", description: "Delays, failures, or incorrect amounts" },
  { id: "service", label: "Service Request", description: "Issue with update requests or profile changes" },
  { id: "account", label: "Account Access", description: "Login issues, security, or profile access" },
  { id: "technical", label: "Technical Issue", description: "Website bugs or application errors" },
  { id: "other", label: "General Inquiry", description: "Other complaints or feedback" },
];

export default function InvestorComplaints() {
  const { fetchWithAuth } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Form State
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "transaction",
    reference_id: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (fetchWithAuth) {
      fetchComplaints();
    }
  }, [fetchWithAuth]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/complaints`);
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) return;

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/investor/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit complaint");

      const result = await res.json();
      setComplaints([result.data, ...complaints]);
      setSuccessMsg("Your complaint has been registered. Reference ID: #" + String(result.data.id).padStart(5, '0'));
      setShowModal(false);
      setForm({ subject: "", description: "", category: "transaction", reference_id: "" });
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "closed": return "bg-slate-100 text-slate-600 border-slate-200";
      case "in_progress": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const getCategoryLabel = (id) => {
    return complaintCategories.find(c => c.id === id)?.label || "Other";
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === "open").length,
    progress: complaints.filter(c => c.status === "in_progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-rose-700 via-crimson-800 to-red-900 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                <ShieldAlert className="w-12 h-12 text-rose-100" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Investor Complaints</h1>
                <p className="text-rose-100/70 text-lg mt-2 font-medium">Formal resolution portal for your concerns and grievances</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group flex items-center gap-3 bg-white text-rose-700 hover:bg-rose-50 px-8 py-4 rounded-2xl font-black transition-all shadow-xl hover:shadow-rose-900/20 hover:-translate-y-1"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              LODGE A COMPLAINT
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              { label: "Active Grievances", value: stats.open, icon: AlertCircle, color: "rose" },
              { label: "Being Addressed", value: stats.progress, icon: Clock, color: "amber" },
              { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "emerald" },
              { label: "Total History", value: stats.total, icon: History, color: "white" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                  <s.icon className={`w-6 h-6 ${s.color === 'white' ? 'text-white' : `text-${s.color}-400`}`} />
                  <div>
                    <p className="text-white/60 text-sm font-bold uppercase tracking-wider">{s.label}</p>
                    <p className="text-3xl font-black mt-1">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {successMsg && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex items-center gap-4 text-emerald-800 shadow-lg shadow-emerald-700/5 animate-in fade-in slide-in-from-top-4">
            <div className="p-3 bg-emerald-500 rounded-xl text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-lg">Submission Successful</p>
              <p className="opacity-80 font-medium">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Complaints Table */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-rose-900/5 border border-slate-200 overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Complaint Record</h2>
              <p className="text-slate-500 font-medium mt-1">Timeline of your formal communication with our support team</p>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by subject..."
                className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-80 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-500 font-bold text-lg">Retrieving your secure records...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                <LifeBuoy className="w-16 h-16 text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">No Active Grievances</h3>
              <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                You haven't filed any complaints yet. We strive to keep it that way, but we're here if you need us.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">ID / Date</th>
                    <th className="px-10 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Grievance Overview</th>
                    <th className="px-10 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-10 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                    <th className="px-10 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="group hover:bg-rose-50/30 transition-colors">
                      <td className="px-10 py-8">
                        <p className="font-mono text-xs font-bold text-slate-400 mb-1">#{String(c.id).padStart(5, '0')}</p>
                        <p className="font-black text-slate-900">{new Date(c.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-10 py-8 max-w-md">
                        <p className="font-black text-slate-900 text-lg mb-1 group-hover:text-rose-700 transition-colors line-clamp-1">{c.subject}</p>
                        <p className="text-slate-500 text-sm line-clamp-1 font-medium italic">{c.description}</p>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                          {getCategoryLabel(c.category)}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(c.status)}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:shadow-lg transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lodge Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl shadow-rose-900/50 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-rose-600 to-crimson-700 px-12 py-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black">Lodge Complaint</h3>
                  <p className="text-rose-100/70 font-medium">Please provide accurate details for swift resolution</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-4 hover:bg-white/10 rounded-2xl transition-colors"
                disabled={submitting}
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Complaint Category</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {complaintCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${form.category === cat.id
                            ? "bg-rose-50 border-rose-300 ring-4 ring-rose-500/10 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-300"
                          }`}
                      >
                        <p className={`font-black ${form.category === cat.id ? "text-rose-700" : "text-slate-900"}`}>{cat.label}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{cat.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Concise Subject</label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-900"
                      placeholder="Enter a brief summary of your issue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Reference ID (Optional)</label>
                    <input
                      type="text"
                      value={form.reference_id}
                      onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-900"
                      placeholder="E.g. Transaction ID or Service Request ID"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Comprehensive Description</label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium text-slate-700 leading-relaxed"
                  placeholder="Provide all relevant details, including chronological events, impacts, and expected outcomes..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-colors"
                  disabled={submitting}
                >
                  DISCARD
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-5 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-900/20 hover:bg-rose-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {submitting ? "REGISTERING GRIEVANCE..." : "OFFICIALLY SUBMIT COMPLAINT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-10 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl border ${getStatusStyle(selectedComplaint.status)}`}>
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Case # {String(selectedComplaint.id).padStart(5, '0')}</h3>
                  <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px] mt-1 italic">Formal Grievance Report</p>
                </div>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</p>
                  <p className="text-lg font-black text-slate-800">{getCategoryLabel(selectedComplaint.category)}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lodged On</p>
                  <p className="text-lg font-black text-slate-800">{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Subject Matter</p>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xl font-black text-rose-800">{selectedComplaint.subject}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Detailed Grievance</p>
                <p className="text-slate-700 leading-loose font-medium bg-slate-50 p-8 rounded-[2rem] italic border border-slate-100 shadow-inner">
                  "{selectedComplaint.description}"
                </p>
              </div>

              {selectedComplaint.resolution_comments && (
                <div className="mt-6 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-lg shadow-emerald-500/5">
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Official Resolution Update
                  </p>
                  <p className="text-emerald-900 font-black mb-2 italic">From Compliance Officer:</p>
                  <p className="text-emerald-800 font-medium leading-relaxed">{selectedComplaint.resolution_comments}</p>
                  <p className="text-xs text-emerald-600 mt-4 font-bold flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Resolved on {new Date(selectedComplaint.resolved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-full py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black shadow-sm hover:shadow-lg transition-all"
              >
                CLOSE RECORD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
