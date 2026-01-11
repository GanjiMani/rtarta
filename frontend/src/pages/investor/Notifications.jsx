import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Bell,
  Check,
  CheckCircle,
  X,
  Trash2,
  Filter,
  AlertCircle,
  Info,
  ShieldCheck,
  ArrowRight,
  Clock,
  Inbox
} from "lucide-react";

const notificationTypes = {
  transaction: { icon: ArrowRight, color: "blue", label: "Transaction" },
  system: { icon: Info, color: "indigo", label: "System Update" },
  security: { icon: ShieldCheck, color: "violet", label: "Security" },
  alert: { icon: AlertCircle, color: "rose", label: "Alert" },
  service_request: { icon: CheckCircle, color: "emerald", label: "Service Request" },
};

export default function Notifications() {
  const { fetchWithAuth } = useAuth();
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread

  useEffect(() => {
    if (fetchWithAuth) {
      fetchNotifications();
    }
  }, [fetchWithAuth]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/notifications`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotes(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/investor/notifications/${id}/read`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to mark as read");

      setNotes(notes.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetchWithAuth(`/api/investor/notifications/read-all`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");

      setNotes(notes.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notification history?")) return;
    try {
      const res = await fetchWithAuth(`/api/investor/notifications/clear`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to clear notifications");
      setNotes([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notes.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Indigo Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl animate-pulse"></div>
        <div className="relative px-6 py-12 max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <Bell className="w-10 h-10 text-indigo-100" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Notifications</h1>
              <p className="text-indigo-100/70 text-lg mt-1">Stay updated with your account activity and system alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-bold transition-all border border-white/10"
              >
                <Check className="w-5 h-5" />
                Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-100 px-5 py-3 rounded-xl font-bold transition-all border border-rose-500/20"
            >
              <Trash2 className="w-5 h-5" />
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-10 max-w-6xl mx-auto">
        {error && (
          <div className="mb-8 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-rose-700 font-semibold">{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Filters/Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${filter === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            All <span className="ml-1 opacity-60 font-medium">({notes.length})</span>
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${filter === "unread" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Unread {unreadCount > 0 && <span className="ml-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">{unreadCount}</span>}
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white h-24 rounded-2xl border border-slate-100 animate-pulse"></div>
            ))
          ) : filteredNotes.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No notifications found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {filter === "unread" ? "You've read all your notifications. Great job staying updated!" : "Your inbox is currently empty. We'll notify you here when there's something new."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredNotes.map((note) => {
                const config = notificationTypes[note.notification_type] || notificationTypes.system;
                const Icon = config.icon;

                return (
                  <div
                    key={note.id}
                    className={`group relative bg-white p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-0.5 ${!note.is_read ? "border-indigo-100 shadow-sm" : "border-slate-100 opacity-80"
                      }`}
                  >
                    {!note.is_read && (
                      <div className="absolute top-6 left-0 w-1 h-12 bg-indigo-600 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                    )}

                    <div className="flex items-start gap-6">
                      <div className={`p-4 rounded-2xl ${note.is_read ? 'bg-slate-50 text-slate-400' : `bg-${config.color}-50 text-${config.color}-600`} transition-colors`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${note.is_read ? 'text-slate-400' : `text-${config.color}-600`}`}>
                              {config.label}
                            </span>
                            <span className="text-slate-300 text-xs">•</span>
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(note.created_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          {!note.is_read && (
                            <button
                              onClick={() => markRead(note.id)}
                              className="text-indigo-600 font-bold text-sm hover:text-indigo-800 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark as read
                            </button>
                          )}
                        </div>

                        <h4 className={`text-xl font-bold mb-1 truncate ${note.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                          {note.title}
                        </h4>
                        <p className={`text-slate-600 leading-relaxed max-w-4xl ${note.is_read ? 'line-clamp-1' : ''}`}>
                          {note.message}
                        </p>
                      </div>

                      {note.priority === "high" && (
                        <div className="flex-shrink-0">
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-100">
                            Urgent
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
