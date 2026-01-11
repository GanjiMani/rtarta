import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Search,
  HelpCircle,
  Mail,
  Phone,
  FileText
} from "lucide-react";

export default function Support() {
  const { fetchWithAuth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form State
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "medium"
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (fetchWithAuth) {
      fetchTickets();
    }
  }, [fetchWithAuth]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/support/tickets`);
      if (!res.ok) throw new Error("Failed to fetch support tickets");
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/investor/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create support ticket");

      const result = await res.json();
      setTickets([result.data, ...tickets]);
      setSuccessMsg("Support ticket created successfully. Tracking ID: #" + String(result.data.id).padStart(5, '0'));
      setShowModal(false);
      setForm({ subject: "", message: "", priority: "medium" });
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
      case "in_progress": return "bg-cyan-100 text-cyan-700 border-cyan-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent": return "text-rose-600 bg-rose-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "low": return "text-slate-500 bg-slate-50";
      default: return "text-cyan-600 bg-cyan-50";
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Support Header */}
      <div className="bg-gradient-to-br from-cyan-600 via-sky-700 to-blue-800 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="flex items-center gap-8">
              <div className="p-5 bg-white/10 rounded-[2rem] backdrop-blur-xl border border-white/20 shadow-inner group">
                <LifeBuoy className="w-14 h-14 text-cyan-100 group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight mb-2">Help Center</h1>
                <p className="text-cyan-100/80 text-xl font-medium">How can we assist your investment journey today?</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-3 bg-white text-cyan-700 hover:bg-cyan-50 px-10 py-5 rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1 active:scale-95"
              >
                <Plus className="w-6 h-6" />
                NEW SUPPORT TICKET
              </button>
            </div>
          </div>

          {/* Support Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { label: "Active Tickets", value: stats.open, icon: MessageSquare, color: "amber" },
              { label: "In Progress", value: stats.progress, icon: Clock, color: "cyan" },
              { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "emerald" },
              { label: "Total History", value: stats.total, icon: HelpCircle, color: "white" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-lg hover:bg-white/20 transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-white/10 rounded-xl text-white`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                    <p className="text-3xl font-black mt-0.5">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {successMsg && (
          <div className="mb-10 bg-emerald-50 border border-emerald-200 p-8 rounded-[2.5rem] flex items-center gap-6 text-emerald-800 shadow-xl shadow-emerald-500/5 animate-in fade-in slide-in-from-top-6">
            <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-xl">Request Received</p>
              <p className="opacity-80 font-bold text-lg">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg("")} className="ml-auto p-2 hover:bg-emerald-100 rounded-xl transition-colors">
              <X className="w-8 h-8 text-emerald-400" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content: Support History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-cyan-900/5 border border-slate-200/60 overflow-hidden">
              <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Support History</h2>
                  <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs italic">Your secure communication log</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl w-64 focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-slate-600"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-32 text-center">
                  <div className="w-20 h-20 border-8 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-xl shadow-cyan-500/20"></div>
                  <p className="text-slate-400 font-black text-xl animate-pulse">Establishing secure connection...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-32 text-center group">
                  <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-slate-100 shadow-inner transition-transform group-hover:scale-105 duration-500">
                    <MessageSquare className="w-20 h-20 text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">Inbox Clear</h3>
                  <p className="text-slate-400 max-w-sm mx-auto text-lg leading-relaxed font-medium">
                    You don't have any support tickets yet. When you raise a query, it will appear here for tracking.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-12 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">ID / Date</th>
                        <th className="px-12 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Inquiry Details</th>
                        <th className="px-12 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-12 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tickets.map((t) => (
                        <tr key={t.id} className="group hover:bg-cyan-50/30 transition-all">
                          <td className="px-12 py-10">
                            <p className="font-mono text-xs font-black text-cyan-600 mb-1 tracking-tighter">#TKT-{String(t.id).padStart(5, '0')}</p>
                            <p className="font-black text-slate-900">{new Date(t.created_at).toLocaleDateString()}</p>
                          </td>
                          <td className="px-12 py-10 max-w-sm">
                            <div className="flex items-center gap-3 mb-2">
                              {t.priority === "urgent" && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                              <p className="font-black text-slate-900 text-xl group-hover:text-cyan-700 transition-colors line-clamp-1">{t.subject}</p>
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-1 font-medium">{t.message}</p>
                          </td>
                          <td className="px-12 py-10 text-center">
                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(t.status)}`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-12 py-10 text-right">
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-cyan-600 hover:border-cyan-200 hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none"
                            >
                              <ChevronRight className="w-6 h-6" />
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

          {/* Right Content: FAQ / Contact Cards */}
          <div className="space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-200/60 shadow-xl shadow-cyan-900/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Mail className="w-24 h-24 text-cyan-600" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <HelpCircle className="w-8 h-8 text-cyan-600" />
                Quick Support
              </h4>
              <div className="space-y-6">
                {[
                  { icon: Mail, label: "Email Correspondence", value: "support@rtarta.com", sub: "24-48h Response Time" },
                  { icon: Phone, label: "Toll-Free Helpline", value: "1800-456-7890", sub: "Mon-Sat, 9AM-6PM IST" },
                  { icon: FileText, label: "Knowledge Base", value: "Visit Help Portal", sub: "Tutorials & Documentation" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                    <div className="p-3 bg-white rounded-xl text-cyan-600 shadow-sm border border-slate-100">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-slate-900 font-black">{item.value}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[3rem] p-10 text-white shadow-xl shadow-cyan-900/20 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-2xl font-black mb-4">Need Immediate Help?</h4>
                <p className="text-cyan-100 font-medium mb-8 leading-relaxed opacity-80">Check our pre-filled service requests for common modifications before raising a ticket.</p>
                <button className="w-full py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl font-black transition-all border border-white/20">
                  GO TO SERVICE REQUESTS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raised Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl shadow-cyan-900/50 overflow-hidden animate-in zoom-in-95 duration-400 relative">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-16 py-14 flex items-center justify-between text-white">
              <div className="flex items-center gap-8">
                <div className="p-5 bg-white/10 rounded-3xl border border-white/20 shadow-inner">
                  <Plus className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-4xl font-black mb-2">Raise Support Ticket</h3>
                  <p className="text-cyan-100 font-medium text-lg opacity-80">Our specialized team is ready to assist you</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-5 hover:bg-white/10 rounded-2xl transition-all group"
                disabled={submitting}
              >
                <X className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-16 py-14 space-y-10 group/form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="relative">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 italic">Priority Level</label>
                    <div className="grid grid-cols-3 gap-4">
                      {["low", "medium", "urgent"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p })}
                          className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${form.priority === p
                              ? "bg-cyan-50 border-cyan-500 text-cyan-700 shadow-lg shadow-cyan-500/10"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 italic">Ticket Subject</label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:bg-white focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/5 transition-all font-black text-slate-900 text-lg placeholder:text-slate-200"
                      placeholder="e.g. Dividend Payment Inquiry"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative group/info overflow-hidden">
                  <HelpCircle className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-200 rotation group-hover/info:rotate-12 transition-transform duration-700" />
                  <p className="text-slate-900 font-black text-lg mb-4 flex items-center gap-3 relative z-10">
                    <AlertCircle className="w-6 h-6 text-cyan-500" />
                    Support Guide
                  </p>
                  <ul className="space-y-4 relative z-10">
                    {[
                      "Provide relevant transaction IDs",
                      "Mention the folio number if applicable",
                      "Be descriptive with the issue context",
                      "A response is typically provided in 24h"
                    ].map((text, i) => (
                      <li key={i} className="flex gap-4 text-slate-500 font-bold text-sm leading-relaxed">
                        <span className="text-cyan-500">▸</span> {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 italic">Detailed Query Message</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-10 py-8 bg-slate-50 border-2 border-slate-50 rounded-[3rem] focus:bg-white focus:border-cyan-500 focus:ring-8 focus:ring-cyan-500/5 transition-all font-bold text-slate-700 leading-loose text-lg placeholder:text-slate-200"
                  placeholder="Describe your query comprehensively..."
                />
              </div>

              <div className="flex gap-6 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-6 rounded-3xl font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all uppercase tracking-widest text-xs"
                  disabled={submitting}
                >
                  DISCARD DRAFT
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-6 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-[2rem] font-black shadow-2xl shadow-cyan-900/40 hover:scale-[1.02] hover:shadow-cyan-900/60 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-widest"
                >
                  {submitting ? "SUBMITTING QUERY..." : "LODGE OFFICIAL TICKET"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details View Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="px-16 py-12 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className={`p-5 rounded-[2rem] border shadow-inner ${getStatusStyle(selectedTicket.status)}`}>
                  <LifeBuoy className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Case ID #TKT-{String(selectedTicket.id).padStart(5, '0')}</h3>
                  <p className="text-slate-400 font-black tracking-widest uppercase text-xs mt-2 italic flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Secure Support record
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                <X className="w-10 h-10 text-slate-300 hover:text-slate-900 transition-colors" />
              </button>
            </div>

            <div className="p-16 space-y-12">
              <div className="grid grid-cols-3 gap-12 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
                <div>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2 italic">Priority</p>
                  <p className={`text-lg font-black ${getPriorityStyle(selectedTicket.priority)} px-3 py-1 rounded-lg inline-block uppercase text-[10px] tracking-tighter`}>{selectedTicket.priority}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2 italic">Status</p>
                  <p className="text-lg font-black text-slate-900 uppercase">{(selectedTicket.status || 'open').replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2 italic">Generated On</p>
                  <p className="text-lg font-black text-slate-900">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 italic">Inquiry Subject</p>
                <div className="p-10 bg-gradient-to-br from-white to-slate-50 rounded-[3rem] border border-cyan-100 shadow-lg shadow-cyan-500/5">
                  <p className="text-2xl font-black text-cyan-900 leading-tight">{selectedTicket.subject}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 italic">Member Message</p>
                <p className="text-slate-700 leading-[2.2] font-semibold bg-white p-12 rounded-[3.5rem] italic border border-slate-100 shadow-inner text-xl relative">
                  <span className="absolute -top-6 -left-2 text-8xl text-slate-100 font-serif opacity-50">"</span>
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.resolution_notes && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-12 rounded-[3.5rem] border border-emerald-100 shadow-xl shadow-emerald-500/10">
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" /> Helpdesk official resolution
                  </p>
                  <div className="flex gap-6 mb-4">
                    <div className="w-1.5 h-auto bg-emerald-500/20 rounded-full" />
                    <p className="text-emerald-950 font-black text-xl leading-relaxed italic">"{selectedTicket.resolution_notes}"</p>
                  </div>
                  <p className="text-[10px] text-emerald-500 mt-6 font-black uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Concluded on {new Date(selectedTicket.resolved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="p-14 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] font-black shadow-lg hover:shadow-2xl hover:border-cyan-100 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                CLOSE SECURE RECORD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldAlert(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
