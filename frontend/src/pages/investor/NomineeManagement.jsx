import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Users, CheckCircle, Edit2, Trash2, Plus, ShieldCheck } from "lucide-react";

const nomineeRelations = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];

export default function NomineeManagement() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [nomineeEditIndex, setNomineeEditIndex] = useState(-1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState({ type: null, id: null, index: null });

  const [nominees, setNominees] = useState([]);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchNominees();
    }
  }, [fetchWithAuth]);

  const fetchNominees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      const profileData = data.data || {};
      setNominees(profileData.nominees || []);
    } catch (err) {
      setError("Failed to load nominees: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e, index) => {
    const { name, value } = e.target;
    const newNominees = [...nominees];
    newNominees[index] = { ...newNominees[index], [name]: value };
    setNominees(newNominees);
  };

  const saveNominee = async (index) => {
    try {
      const nominee = nominees[index];
      const isNew = !nominee.id;

      const payload = {
        nominee_name: nominee.nominee_name || nominee.name,
        nominee_pan: nominee.nominee_pan,
        relationship: nominee.relationship || nominee.nominee_relationship,
        date_of_birth: nominee.date_of_birth,
        gender: nominee.gender,
        allocation_percentage: parseFloat(nominee.allocation_percentage || nominee.pct || 100),
        mobile_number: nominee.mobile_number,
        email: nominee.email,
        address: nominee.address,
        guardian_name: nominee.guardian_name,
        guardian_pan: nominee.guardian_pan,
        guardian_relation: nominee.guardian_relation || nominee.guardian_relationship,
      };

      const url = isNew
        ? "/api/investor/profile/nominees"
        : `/api/investor/profile/nominees/${nominee.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save nominee");
      }

      setNomineeEditIndex(-1);
      setSuccessMsg(isNew ? "Nominee added successfully" : "Nominee updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchNominees();
    } catch (err) {
      setError(err.message || "Failed to save nominee");
    }
  };

  const deleteNominee = async (index) => {
    try {
      const nominee = nominees[index];
      if (!nominee.id) {
        setNominees((prev) => prev.filter((_, i) => i !== index));
        setShowDeleteConfirm({ type: null, id: null, index: null });
        return;
      }

      const response = await fetchWithAuth(`/api/investor/profile/nominees/${nominee.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete nominee");

      setSuccessMsg("Nominee deleted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      setShowDeleteConfirm({ type: null, id: null, index: null });
      fetchNominees();
    } catch (err) {
      setError(err.message || "Failed to delete nominee");
      setShowDeleteConfirm({ type: null, id: null, index: null });
    }
  };

  const addNominee = () => {
    setNominees((prev) => [
      ...prev,
      {
        nominee_name: "",
        relationship: "",
        date_of_birth: "",
        allocation_percentage: 100,
      },
    ]);
    setNomineeEditIndex(nominees.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nominee Management</h1>
          <p className="text-gray-600">
            Designate beneficiaries for your investment portfolio
          </p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
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
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Nominee Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={addNominee}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Nominee
          </button>
        </div>

        {/* Nominees List */}
        {loading ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading nominees...</p>
          </div>
        ) : nominees.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Nominees Declared</h3>
            <p className="text-gray-500 mb-6">
              Nomination is critical for the smooth transfer of assets to your loved ones.
            </p>
            <button
              onClick={addNominee}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Nominee Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {nominees.map((nominee, index) =>
              nomineeEditIndex === index ? (
                <div key={index} className="bg-white shadow-lg rounded-xl p-8 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {nominee.id ? "Update Nominee Profile" : "New Nominee Declaration"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Nominee Legal Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nominee_name"
                        value={nominee.nominee_name || nominee.name || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Familial Relationship <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="relationship"
                        value={nominee.relationship || nominee.nominee_relationship || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">-- Select Relationship --</option>
                        {nomineeRelations.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={nominee.date_of_birth || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Asset Allocation (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="allocation_percentage"
                        value={nominee.allocation_percentage || nominee.pct || 100}
                        onChange={(e) => handleFieldChange(e, index)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Contact Mobile</label>
                      <input
                        type="tel"
                        name="mobile_number"
                        value={nominee.mobile_number || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9999999999"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={nominee.email || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="nominee@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Nominee PAN</label>
                      <input
                        type="text"
                        name="nominee_pan"
                        value={nominee.nominee_pan || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        maxLength="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Nominee Gender</label>
                      <select
                        name="gender"
                        value={nominee.gender || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Nominee Address</label>
                      <input
                        type="text"
                        name="address"
                        value={nominee.address || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full Address"
                      />
                    </div>

                    <div className="md:col-span-2 py-4">
                      <div className="h-px bg-gray-200 w-full mb-6"></div>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        Guardian Details (For Minor Nominees)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Guardian Name</label>
                          <input
                            type="text"
                            name="guardian_name"
                            value={nominee.guardian_name || ""}
                            onChange={(e) => handleFieldChange(e, index)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Guardian's Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Guardian Relation</label>
                          <input
                            type="text"
                            name="guardian_relation"
                            value={nominee.guardian_relation || nominee.guardian_relationship || ""}
                            onChange={(e) => handleFieldChange(e, index)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Father/Mother/Other"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Guardian PAN</label>
                          <input
                            type="text"
                            name="guardian_pan"
                            value={nominee.guardian_pan || ""}
                            onChange={(e) => handleFieldChange(e, index)}
                            maxLength="10"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                            placeholder="ABCDE1234F"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => saveNominee(index)}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Save Nominee
                    </button>
                    <button
                      onClick={() => {
                        setNomineeEditIndex(-1);
                        fetchNominees();
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    {nominee.id && (
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "nominee", id: nominee.id, index })}
                        className="px-6 py-3 border-2 border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key={index} className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {nominee.nominee_name || nominee.name || "Designated Nominee"}
                          </h3>
                          <p className="text-gray-600">
                            {nominee.relationship || nominee.nominee_relationship || "Family Member"}
                          </p>
                        </div>
                        <div className="lg:ml-auto">
                          <span className="text-2xl font-bold text-blue-600">
                            {nominee.allocation_percentage || nominee.pct || 0}%
                          </span>
                          <p className="text-xs text-gray-500 uppercase">Allocation</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Date of Birth</p>
                          <p className="font-medium text-gray-900">
                            {nominee.date_of_birth
                              ? new Date(nominee.date_of_birth).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">PAN & Gender</p>
                          <p className="font-medium text-gray-900">
                            {nominee.nominee_pan || "No PAN"} | {nominee.gender || "NA"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 uppercase mb-1">Contact</p>
                          <p className="font-medium text-gray-900">
                            {nominee.mobile_number || nominee.email
                              ? `${nominee.mobile_number || ""} ${nominee.email ? `| ${nominee.email}` : ""}`
                              : "No contact"}
                          </p>
                        </div>
                      </div>

                      {nominee.address && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Address</p>
                          <p className="text-sm text-gray-700">{nominee.address}</p>
                        </div>
                      )}

                      {nominee.guardian_name && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-600 uppercase mb-1">Legal Guardian</p>
                          <p className="text-sm font-medium text-gray-900">
                            {nominee.guardian_name} ({nominee.guardian_relation || nominee.guardian_relationship || "Guardian"})
                            {nominee.guardian_pan && <span className="ml-2 text-gray-500 text-xs">| {nominee.guardian_pan}</span>}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-3">
                      <button
                        onClick={() => setNomineeEditIndex(index)}
                        className="flex-1 lg:w-full px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "nominee", id: nominee.id, index })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Nominee"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm.type === "nominee" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this nominee? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm({ type: null, id: null, index: null })}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteNominee(showDeleteConfirm.index)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
