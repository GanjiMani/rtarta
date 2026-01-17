import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { Bell, CheckCircle, Trash2, ArrowRight, Info, ShieldCheck, AlertCircle, ArrowLeft, Check } from "lucide-react";

export default function Notifications() {
  const { fetchWithAuth } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (fetchWithAuth) fetchNotifications(); }, [fetchWithAuth]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/investor/notifications`);
      if (res.ok) setNotes((await res.json()).data || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await fetchWithAuth(`/api/investor/notifications/${id}/read`, { method: "PUT" });
      setNotes(notes.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { }
  };

  const markAllRead = async () => {
    try {
      await fetchWithAuth(`/api/investor/notifications/read-all`, { method: "POST" });
      setNotes(notes.map(n => ({ ...n, is_read: true })));
    } catch (e) { }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all?")) return;
    try {
      await fetchWithAuth(`/api/investor/notifications/clear`, { method: "POST" });
      setNotes([]);
    } catch (e) { }
  };

  const filtered = notes.filter(n => filter === "unread" ? !n.is_read : true);
  const unreadCount = notes.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm">Updates & Alerts.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && <button onClick={markAllRead} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium flex items-center gap-1"><Check size={14} /> Mark All Read</button>}
          <button onClick={clearAll} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-sm flex items-center gap-1"><Trash2 size={14} /> Clear</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>All</button>
        <button onClick={() => setFilter("unread")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'unread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Unread {unreadCount > 0 && `(${unreadCount})`}</button>
      </div>

      {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n.id} className={`p-4 rounded-lg border flex gap-4 transition-colors ${n.is_read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${n.notification_type === 'alert' ? 'bg-red-100 text-red-600' : n.notification_type === 'security' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {n.notification_type === 'alert' ? <AlertCircle size={16} /> : n.notification_type === 'security' ? <ShieldCheck size={16} /> : <Info size={16} />}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-bold ${n.is_read ? 'text-gray-700' : 'text-blue-900'}`}>{n.title}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className={`text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-800'}`}>{n.message}</p>
                {!n.is_read && <button onClick={() => markRead(n.id)} className="mt-2 text-xs font-medium text-blue-600 hover:underline">Mark as Read</button>}
              </div>
            </div>
          ))}
          {!filtered.length && <div className="p-12 text-center text-gray-400 border border-gray-100 border-dashed rounded-lg">No notifications.</div>}
        </div>
      )}
    </div>
  );
}
