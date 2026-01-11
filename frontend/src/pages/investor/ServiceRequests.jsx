import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  FileText,
  Plus,
  MapPin,
  Phone,
  CreditCard,
  UserCheck,
  History,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ChevronRight,
  MessageSquare,
  Filter,
  ArrowRight
} from "lucide-react";

const requestTypes = [
  { id: "address_change", label: "Change of Address", icon: MapPin },
  { id: "mobile_change", label: "Change of Mobile", icon: Phone },
  { id: "bank_update", label: "Bank Mandate Update", icon: CreditCard },
  { id: "kyc_update", label: "PAN/KYC Update", icon: UserCheck },
  { id: "statement_request", label: "Account Statement", icon: FileText },
  { id: "nominee_update", label: "Nominee Update", icon: History },
  { id: "other", label: "Other", icon: MessageSquare },
];

export default function ServiceRequests() {
  const { fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [form, setForm] = useState({
    request_type: "address_change",
    description: "",
    priority: "medium"
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchRequests();
    }
  }, [fetchWithAuth]);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/service-requests`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Please describe your request details");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetchWithAuth(`/api/investor/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Submission failed");
      }

      const result = await res.json();
      setRequests([result.data, ...requests]);
      setForm({ request_type: "address_change", description: "", priority: "medium" });
      setShowModal(false);
      setSuccessMsg("Service request raised successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;

    try {
      const res = await fetchWithAuth(`/api/investor/service-requests/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to cancel request");

      fetchRequests();
      setSuccessMsg("Request cancelled successfully");
      setShowDetails(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "in progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "text-red-600";
      case "medium": return "text-amber-600";
      default: return "text-blue-600";
    }
  };

  const getRequestTypeLabel = (id) => {
    return requestTypes.find(t => t.id === id)?.label || id;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <FileText className="w-8 h-8 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Service Requests</h1>
              <p className="text-emerald-100/80 text-lg">Track and manage your account-related requests</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-50 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Raise New Request
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Filters/Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Requests", value: requests.length, icon: FileText, color: "blue" },
            { label: "Pending", value: requests.filter(r => r.status === "pending").length, icon: Clock, color: "amber" },
            { label: "In Progress", value: requests.filter(r => r.status === "in_progress").length, icon: History, color: "blue" },
            { label: "Resolved", value: requests.filter(r => r.status === "resolved").length, icon: CheckCircle, color: "emerald" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Recent Requests
            </h2>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="6" className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-lg"></div></td>
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No requests yet</h3>
                        <p className="text-gray-500 mb-6">Raise a service request for any account related assistance.</p>
                        <button onClick={() => setShowModal(true)} className="text-emerald-600 font-bold hover:underline">
                          Create your first request
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">#{String(req.id).padStart(5, '0')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-white transition-colors">
                            {(() => {
                              const ReqIcon = requestTypes.find(t => t.id === req.request_type)?.icon || FileText;
                              return <ReqIcon size={16} />;
                            })()}
                          </div>
                          <span className="font-semibold text-gray-900">{getRequestTypeLabel(req.request_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(req.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase tracking-wider ${getPriorityStyle(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedRequest(req); setShowDetails(true); }}
                          className="flex items-center gap-1 ml-auto text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">New Service Request</h3>
                <p className="text-emerald-100/80 text-sm">We'll get back to you within 24-48 hours</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Topic of Request</label>
                <div className="grid grid-cols-2 gap-3">
                  {requestTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm({ ...form, request_type: type.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${form.request_type === type.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600/20'
                        : 'border-gray-100 hover:border-emerald-200 bg-gray-50 text-gray-600'
                        }`}
                    >
                      <type.icon className={`w-4 h-4 ${form.request_type === type.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="text-xs font-bold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description & Details</label>
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell us exactly what you need help with..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  required
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Submit Request <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Sidebar/Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowDetails(false)}></div>
          <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-emerald-600 font-bold bg-white px-2 py-0.5 rounded shadow-sm">#{String(selectedRequest.id).padStart(5, '0')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{getRequestTypeLabel(selectedRequest.request_type)}</h3>
                </div>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History className="w-3 h-3" /> Request History
                  </h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
                    <div className="relative">
                      <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50"></div>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">Request Raised</p>
                        <p className="text-gray-500 text-xs">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedRequest.status !== "pending" && (
                      <div className="relative">
                        <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50"></div>
                        <div className="text-sm">
                          <p className="font-bold text-gray-900">Processing Started</p>
                          <p className="text-gray-500 text-xs">Updated at {new Date(selectedRequest.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.closed_at && (
                      <div className="relative">
                        <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-emerald-700 border-2 border-white ring-4 ring-emerald-100"></div>
                        <div className="text-sm">
                          <p className="font-bold text-gray-900">Final Resolution</p>
                          <p className="text-gray-500 text-xs">{new Date(selectedRequest.closed_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Your Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed italic whitespace-pre-wrap">
                    "{selectedRequest.description}"
                  </p>
                </div>

                {selectedRequest.resolution_comments && (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Official Resolution
                    </h4>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      {selectedRequest.resolution_comments}
                    </p>
                  </div>
                )}

                {!['resolved', 'rejected', 'cancelled'].includes(selectedRequest.status) && (
                  <div className="pt-6">
                    <button
                      onClick={() => cancelRequest(selectedRequest.id)}
                      className="w-full py-3 text-red-600 font-bold border-2 border-red-100 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Cancel This Request
                    </button>
                    <p className="mt-2 text-[10px] text-gray-400 text-center">Requests can only be cancelled while in 'Pending' state.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
