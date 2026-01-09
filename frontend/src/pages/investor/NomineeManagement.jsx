import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const nomineeRelations = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];

export default function NomineeManagement() {
  const { fetchWithAuth } = useAuth();
  const [nominees, setNominees] = useState([]);
  const [form, setForm] = useState({ 
    name: "", 
    relation: "", 
    allocation: "", 
    dob: ""
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNominees();
  }, [fetchWithAuth]);

  const fetchNominees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/profile`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Unable to fetch profile" }));
        throw new Error(errorData.detail || "Unable to fetch profile");
      }
      const response = await res.json();
      const nomineesList = (response.data?.nominees || []).map(nominee => ({
        nominee_id: nominee.id,
        name: nominee.full_name || nominee.nominee_name || "",
        relation: nominee.relationship || nominee.nominee_relationship || "",
        pct: nominee.allocation_percentage || 100,
        dob: nominee.date_of_birth || ""
      }));
      setNominees(nomineesList);
    } catch (err) {
      setError("Failed to load nominees: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addNominee = async () => {
    const total = nominees.reduce((s, n) => s + Number(n.pct || 0), 0) + Number(form.allocation || 0);
    
    if (!form.name || !form.relation) {
      setError("Please enter nominee name and relationship");
      setSuccessMsg("");
      return;
    }
    if (!form.allocation || form.allocation <= 0) {
      setError("Allocation percentage must be greater than 0");
      setSuccessMsg("");
      return;
    }
    if (total > 100) {
      setError(`Total allocation cannot exceed 100%. Current total: ${nominees.reduce((s, n) => s + Number(n.pct || 0), 0)}%`);
      setSuccessMsg("");
      return;
    }
    if (!form.dob) {
      setError("Please enter date of birth");
      setSuccessMsg("");
      return;
    }

    try {
      setError("");
      const payload = {
        nominee_name: form.name,
        relationship: form.relation,
        allocation_percentage: parseFloat(form.allocation),
        date_of_birth: form.dob,
      };
      const res = await fetchWithAuth(`/api/investor/profile/nominees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to add nominee" }));
        throw new Error(errorData.detail || "Failed to add nominee");
      }
      setSuccessMsg("Nominee added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm({ name: "", relation: "", allocation: "", dob: "" });
      // Reload nominees
      await fetchNominees();
    } catch (err) {
      setError("Failed to add nominee: " + err.message);
      setSuccessMsg("");
    }
  };

  const removeNominee = async (nomineeId) => {
    if (!window.confirm("Are you sure you want to delete this nominee?")) {
      return;
    }
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/nominees/${nomineeId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to delete nominee" }));
        throw new Error(errorData.detail || "Failed to delete nominee");
      }
      setSuccessMsg("Nominee deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload nominees
      await fetchNominees();
    } catch (err) {
      setError("Failed to delete nominee: " + err.message);
      setSuccessMsg("");
    }
  };

  const totalAllocation = nominees.reduce((s, n) => s + Number(n.pct || 0), 0);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nominees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Nominee Management</h2>
          <p className="text-gray-600 mt-1">Manage your nominees and their allocation percentages</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMsg}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Nominee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nominee Name *</label>
                <input
                  placeholder="Enter nominee full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                <select
                  value={form.relation}
                  onChange={(e) => setForm({ ...form, relation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Select Relationship --</option>
                  {nomineeRelations.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allocation Percentage *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g., 50"
                  value={form.allocation}
                  onChange={(e) => setForm({ ...form, allocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Total allocation must not exceed 100%</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button 
                onClick={addNominee} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add Nominee
              </button>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Current Total Allocation:</span> {totalAllocation}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Nominees</h3>
            {nominees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No nominees added yet.</p>
                <p className="text-sm mt-2">Add a nominee above to get started.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {nominees.map((nominee) => (
                    <div 
                      key={nominee.nominee_id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {nominee.name || "N/A"}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {nominee.relation || "N/A"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Allocation:</span> {nominee.pct || 0}%
                            </div>
                            {nominee.dob && (
                              <div>
                                <span className="font-medium">Date of Birth:</span> {new Date(nominee.dob).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => removeNominee(nominee.nominee_id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Allocation:</span>
                    <span className={`text-lg font-semibold ${totalAllocation === 100 ? 'text-green-600' : totalAllocation > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                      {totalAllocation}%
                    </span>
                  </div>
                  {totalAllocation < 100 && (
                    <p className="text-xs text-gray-500 mt-2">
                      You can add more nominees to reach 100% allocation
                    </p>
                  )}
                  {totalAllocation === 100 && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ All allocation assigned
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}