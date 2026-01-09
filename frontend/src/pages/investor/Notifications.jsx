import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

export default function Notifications() {
  const { fetchWithAuth } = useAuth();
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch notifications");
      }
      const data = await res.json();
      setNotes(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/notifications/${id}/read`, {
        method: "PUT",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to mark notification as read");
      }
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n))
      );
    } catch (err) {
      setError(err.message);
      console.error("Error marking notification as read:", err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/notifications/clear`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to clear notifications");
      }
      setNotes([]);
    } catch (err) {
      setError(err.message);
      console.error("Error clearing notifications:", err);
    }
  };

  const unreadCount = notes.filter((n) => !n.read && !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with important information and updates about your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Card */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">All Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount > 0 ? (
                    <span className="font-semibold text-blue-600">
                      {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    "All notifications read"
                  )}
                </p>
              </div>
              {notes.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Notifications</h3>
              <p className="mt-2 text-sm text-gray-500">
                You're all caught up! There are no new notifications at this time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notes.map((n) => {
                const isRead = n.read || n.is_read;
                return (
                  <div
                    key={n.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !isRead ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start">
                          {!isRead && (
                            <div className="mt-1.5 mr-3">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className={`text-lg font-semibold ${isRead ? "text-gray-700" : "text-gray-900"}`}>
                              {n.title || n.subject || "Notification"}
                            </h4>
                            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                              {n.message || n.content || n.description || "No content"}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                              {n.created_at
                                ? new Date(n.created_at).toLocaleString()
                                : n.date || n.timestamp || "Unknown date"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!isRead && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Mark as Read
                        </button>
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
