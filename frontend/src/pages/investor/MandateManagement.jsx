import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

export default function MandateManagement() {
  const { fetchWithAuth } = useAuth();
  const [mandates, setMandates] = useState([]);
  const [form, setForm] = useState({ scheme: "", type: "UPI" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchMandates();
    }
  }, [fetchWithAuth]);

  const fetchMandates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/bank`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch mandates");
      }
      const data = await res.json();
      setMandates(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching mandates:", err);
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!form.scheme) {
      setError("Please select a scheme");
      setSuccessMsg("");
      return;
    }
    setError("");
    setSuccessMsg("");
    const payload = {
      scheme_id: form.scheme,
      mandate_type: form.type,
    };

    try {
      const res = await fetchWithAuth(`/api/investor/mandates/bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to register mandate");
      }
      const result = await res.json();
      setMandates((prev) => [result.data?.mandate || result.data, ...prev]);
      setForm({ scheme: "", type: "UPI" });
      setSuccessMsg("Mandate registered successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.message);
      console.error("Error registering mandate:", err);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this mandate?")) {
      return;
    }
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/bank/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to revoke mandate");
      }
      setMandates((prev) => prev.filter((m) => m.id !== id));
      setSuccessMsg("Mandate revoked successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.message);
      console.error("Error revoking mandate:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mandate Management</h1>
          <p className="text-gray-600">
            Manage your bank mandates for automated transactions like SIP, SWP, and STP
          </p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Register New Mandate Card */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Register New Mandate</h3>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scheme <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter scheme ID (e.g., S001)"
                value={form.scheme}
                onChange={(e) => setForm({ ...form, scheme: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mandate Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UPI">UPI</option>
                <option value="ECS">ECS</option>
                <option value="NetBanking">Net Banking</option>
                <option value="debit_mandate">Debit Mandate</option>
              </select>
            </div>
            <div>
              <button
                onClick={register}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Register Mandate
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Mandates allow automatic processing of SIP, SWP, and STP transactions without manual intervention for each installment.
          </p>
        </div>

        {/* Mandates List */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Your Mandates</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage all your registered mandates</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading mandates...</p>
            </div>
          ) : mandates.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Mandates Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                You haven't registered any mandates yet. Register a mandate to enable automated transactions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mandates.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {m.scheme || m.scheme_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {m.type || m.mandate_type || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (m.status === "Active" || m.status === "active")
                              ? "bg-green-100 text-green-800"
                              : m.status === "Pending" || m.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {m.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleDateString()
                          : m.created || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(m.status !== "Revoked" && m.status !== "revoked" && m.status !== "Cancelled" && m.status !== "cancelled") && (
                          <button
                            onClick={() => revoke(m.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
