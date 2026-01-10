import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { User, CreditCard, Users, FileText, CheckCircle, X, Edit2, Trash2, Plus, Download, Upload, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const nomineeRelations = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];

export default function Profile() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [personalEdit, setPersonalEdit] = useState(false);
  const [contactEdit, setContactEdit] = useState(false);
  const [bankEditIndex, setBankEditIndex] = useState(-1);
  const [nomineeEditIndex, setNomineeEditIndex] = useState(-1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState({ type: null, id: null, index: null });

  const [profile, setProfile] = useState({
    investor_id: "",
    full_name: "",
    pan_number: "",
    date_of_birth: "",
    gender: "",
    email: "",
    mobile_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    kyc_status: "",
    bank_accounts: [],
    nominees: [],
    documents: [],
  });

  useEffect(() => {
    if (fetchWithAuth) {
      fetchProfile();
      if (activeTab === "documents") {
        fetchDocuments();
      }
    }
  }, [fetchWithAuth, activeTab]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      const profileData = data.data || {};
      
      setProfile({
        investor_id: profileData.investor_id || "",
        full_name: profileData.full_name || "",
        pan_number: profileData.pan_number || "",
        date_of_birth: profileData.date_of_birth || "",
        gender: profileData.gender || "",
        email: profileData.email || "",
        mobile_number: profileData.mobile_number || "",
        address_line1: profileData.address_line1 || "",
        address_line2: profileData.address_line2 || "",
        city: profileData.city || "",
        state: profileData.state || "",
        pincode: profileData.pincode || "",
        kyc_status: profileData.kyc_status || "not_started",
        bank_accounts: profileData.bank_accounts || [],
        nominees: profileData.nominees || [],
        documents: profile.documents || [],
      });
    } catch (err) {
      setError("Failed to load profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/profile/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setProfile((prev) => ({ ...prev, documents: data.data || [] }));
    } catch (err) {
      setError("Failed to load documents: " + err.message);
    }
  };

  const handleFieldChange = (e, section = null, index = null) => {
    const { name, value } = e.target;
    if (section === "bank") {
      const newBanks = [...profile.bank_accounts];
      newBanks[index] = { ...newBanks[index], [name]: value };
      setProfile((prev) => ({ ...prev, bank_accounts: newBanks }));
    } else if (section === "nominee") {
      const newNominees = [...profile.nominees];
      newNominees[index] = { ...newNominees[index], [name]: value };
      setProfile((prev) => ({ ...prev, nominees: newNominees }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const savePersonal = async () => {
    try {
      const payload = {
        full_name: profile.full_name,
        pan_number: profile.pan_number,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
      };

      const response = await fetchWithAuth("/api/investor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update personal information");
      setPersonalEdit(false);
      setSuccessMsg("Personal information updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to update personal information");
    }
  };

  const saveContact = async () => {
    try {
      const payload = {
        email: profile.email,
        mobile_number: profile.mobile_number,
        address_line1: profile.address_line1,
        address_line2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
      };

      const response = await fetchWithAuth("/api/investor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update contact information");
      setContactEdit(false);
      setSuccessMsg("Contact information updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to update contact information");
    }
  };

  const saveBank = async (index) => {
    try {
      const bank = profile.bank_accounts[index];
      const isNew = !bank.id;

      const payload = {
        account_number: bank.account_number,
        account_holder_name: bank.account_holder_name,
        bank_name: bank.bank_name,
        branch_name: bank.branch_name || bank.branch,
        ifsc_code: bank.ifsc_code || bank.ifsc,
        account_type: bank.account_type || "savings",
        bank_address: bank.bank_address,
        city: bank.city,
        state: bank.state,
        pincode: bank.pincode,
      };

      const url = isNew
        ? "/api/investor/profile/bank-accounts"
        : `/api/investor/profile/bank-accounts/${bank.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save bank account");
      }

      setBankEditIndex(-1);
      setSuccessMsg(isNew ? "Bank account added successfully" : "Bank account updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to save bank account");
    }
  };

  const saveNominee = async (index) => {
    try {
      const nominee = profile.nominees[index];
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
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to save nominee");
    }
  };

  const deleteBank = async (index) => {
    try {
      const bank = profile.bank_accounts[index];
      if (!bank.id) {
        // Remove locally if not saved
        setProfile((prev) => ({
          ...prev,
          bank_accounts: prev.bank_accounts.filter((_, i) => i !== index),
        }));
        setShowDeleteConfirm({ type: null, id: null, index: null });
        return;
      }

      const response = await fetchWithAuth(`/api/investor/profile/bank-accounts/${bank.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete bank account");

      setSuccessMsg("Bank account deleted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      setShowDeleteConfirm({ type: null, id: null, index: null });
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to delete bank account");
      setShowDeleteConfirm({ type: null, id: null, index: null });
    }
  };

  const deleteNominee = async (index) => {
    try {
      const nominee = profile.nominees[index];
      if (!nominee.id) {
        // Remove locally if not saved
        setProfile((prev) => ({
          ...prev,
          nominees: prev.nominees.filter((_, i) => i !== index),
        }));
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
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to delete nominee");
      setShowDeleteConfirm({ type: null, id: null, index: null });
    }
  };

  const addBank = () => {
    setProfile((prev) => ({
      ...prev,
      bank_accounts: [
        ...prev.bank_accounts,
        {
          account_number: "",
          account_holder_name: "",
          bank_name: "",
          branch_name: "",
          ifsc_code: "",
          account_type: "savings",
        },
      ],
    }));
    setBankEditIndex(profile.bank_accounts.length);
  };

  const addNominee = () => {
    setProfile((prev) => ({
      ...prev,
      nominees: [
        ...prev.nominees,
        {
          nominee_name: "",
          relationship: "",
          date_of_birth: "",
          allocation_percentage: 100,
        },
      ],
    }));
    setNomineeEditIndex(profile.nominees.length);
  };

  const setPrimaryBank = async (accountId) => {
    try {
      const response = await fetchWithAuth(`/api/investor/profile/bank-accounts/${accountId}/primary`, {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Failed to set primary bank account");

      setSuccessMsg("Primary bank account updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Failed to set primary bank account");
    }
  };

  const uploadDocument = async (file, documentType) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/investor/profile/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload document");
      }

      setSuccessMsg("Document uploaded successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchDocuments();
    } catch (err) {
      setError(err.message || "Failed to upload document");
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      const response = await fetchWithAuth(`/api/investor/profile/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      setSuccessMsg("Document deleted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchDocuments();
      setShowDeleteConfirm({ type: null, id: null, index: null });
    } catch (err) {
      setError(err.message || "Failed to delete document");
      setShowDeleteConfirm({ type: null, id: null, index: null });
    }
  };

  const downloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/investor/profile/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document_${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || "Failed to download document");
    }
  };

  const getKYCStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "verified") {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (statusLower === "pending_verification" || statusLower === "in_progress") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (statusLower === "rejected") {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "contact", label: "Contact Info", icon: User },
    { id: "banks", label: "Bank Accounts", icon: CreditCard },
    { id: "nominees", label: "Nominees", icon: Users },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8" />
            <h1 className="text-3xl font-bold">My Profile</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Manage your personal information, bank accounts, and documents
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">{successMsg}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPersonalEdit(false);
                    setContactEdit(false);
                    setBankEditIndex(-1);
                    setNomineeEditIndex(-1);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                {!personalEdit && (
                  <button
                    onClick={() => setPersonalEdit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {personalEdit ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pan_number"
                        value={profile.pan_number}
                        onChange={handleFieldChange}
                        maxLength="10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={profile.date_of_birth}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <button
                      onClick={savePersonal}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setPersonalEdit(false);
                        fetchProfile();
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Full Name</p>
                      <p className="text-lg font-semibold text-gray-900">{profile.full_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">PAN Number</p>
                      <p className="text-lg font-semibold text-gray-900">{profile.pan_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {profile.date_of_birth
                          ? new Date(profile.date_of_birth).toLocaleDateString("en-IN")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Gender</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {profile.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">KYC Status</p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getKYCStatusBadge(
                          profile.kyc_status
                        )}`}
                      >
                        {profile.kyc_status || "Not Started"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Investor ID</p>
                      <p className="text-lg font-semibold text-gray-900">{profile.investor_id || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === "contact" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
                {!contactEdit && (
                  <button
                    onClick={() => setContactEdit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {contactEdit ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile_number"
                        value={profile.mobile_number}
                        onChange={handleFieldChange}
                        maxLength="10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        name="address_line1"
                        value={profile.address_line1}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="address_line2"
                        value={profile.address_line2}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={profile.state}
                        onChange={handleFieldChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={profile.pincode}
                        onChange={handleFieldChange}
                        maxLength="6"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <button
                      onClick={saveContact}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setContactEdit(false);
                        fetchProfile();
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{profile.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Mobile Number</p>
                      <p className="text-lg font-semibold text-gray-900">{profile.mobile_number || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Address</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {[
                          profile.address_line1,
                          profile.address_line2,
                          profile.city,
                          profile.state,
                          profile.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Accounts Tab */}
          {activeTab === "banks" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bank Accounts</h2>
                <button
                  onClick={addBank}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bank Account
                </button>
              </div>

              <div className="space-y-4">
                {profile.bank_accounts.length > 0 ? (
                  profile.bank_accounts.map((bank, index) =>
                    bankEditIndex === index ? (
                      <div key={index} className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                          {bank.id ? "Edit Bank Account" : "Add Bank Account"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="account_number"
                              value={bank.account_number || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Holder Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="account_holder_name"
                              value={bank.account_holder_name || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="bank_name"
                              value={bank.bank_name || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              IFSC Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="ifsc_code"
                              value={bank.ifsc_code || bank.ifsc || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                              maxLength="11"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Branch Name
                            </label>
                            <input
                              type="text"
                              name="branch_name"
                              value={bank.branch_name || bank.branch || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Type
                            </label>
                            <select
                              name="account_type"
                              value={bank.account_type || "savings"}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="savings">Savings</option>
                              <option value="current">Current</option>
                              <option value="nri_nro">NRI NRO</option>
                              <option value="nri_nre">NRI NRE</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                          <button
                            onClick={() => saveBank(index)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setBankEditIndex(-1);
                              fetchProfile();
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          {bank.id && (
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "bank", id: bank.id, index })
                              }
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 bg-blue-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {bank.bank_name || "Bank Account"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {bank.account_holder_name || "N/A"}
                                </p>
                              </div>
                              {bank.is_primary && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                  Primary
                                </span>
                              )}
                              {bank.is_verified && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Account Number</p>
                                <p className="font-semibold text-gray-900">
                                  ****{bank.account_number?.slice(-4) || "XXXX"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">IFSC Code</p>
                                <p className="font-semibold text-gray-900">
                                  {bank.ifsc_code || bank.ifsc || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Branch</p>
                                <p className="font-semibold text-gray-900">
                                  {bank.branch_name || bank.branch || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Account Type</p>
                                <p className="font-semibold text-gray-900 capitalize">
                                  {bank.account_type || "Savings"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {!bank.is_primary && (
                              <button
                                onClick={() => setPrimaryBank(bank.id)}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => setBankEditIndex(index)}
                              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "bank", id: bank.id, index })
                              }
                              className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No bank accounts added yet</p>
                    <button
                      onClick={addBank}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Bank Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nominees Tab */}
          {activeTab === "nominees" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Nominees</h2>
                <button
                  onClick={addNominee}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Nominee
                </button>
              </div>

              <div className="space-y-4">
                {profile.nominees.length > 0 ? (
                  profile.nominees.map((nominee, index) =>
                    nomineeEditIndex === index ? (
                      <div key={index} className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                          {nominee.id ? "Edit Nominee" : "Add Nominee"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nominee Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="nominee_name"
                              value={nominee.nominee_name || nominee.name || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Relationship <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="relationship"
                              value={nominee.relationship || nominee.nominee_relationship || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="date_of_birth"
                              value={nominee.date_of_birth || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Allocation Percentage <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="allocation_percentage"
                              value={nominee.allocation_percentage || nominee.pct || 100}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mobile Number
                            </label>
                            <input
                              type="tel"
                              name="mobile_number"
                              value={nominee.mobile_number || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={nominee.email || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                          <button
                            onClick={() => saveNominee(index)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setNomineeEditIndex(-1);
                              fetchProfile();
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          {nominee.id && (
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "nominee", id: nominee.id, index })
                              }
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {nominee.nominee_name || nominee.name || "Nominee"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {nominee.relationship || nominee.nominee_relationship || "N/A"}
                                </p>
                              </div>
                              {nominee.is_verified && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Date of Birth</p>
                                <p className="font-semibold text-gray-900">
                                  {nominee.date_of_birth
                                    ? new Date(nominee.date_of_birth).toLocaleDateString("en-IN")
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Allocation</p>
                                <p className="font-semibold text-gray-900">
                                  {nominee.allocation_percentage || nominee.pct || 0}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Mobile</p>
                                <p className="font-semibold text-gray-900">
                                  {nominee.mobile_number || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => setNomineeEditIndex(index)}
                              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "nominee", id: nominee.id, index })
                              }
                              className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No nominees added yet</p>
                    <button
                      onClick={addNominee}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Nominee
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Document
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const docType = prompt("Enter document type (e.g., PAN, Aadhar, KYC):");
                      if (file && docType) {
                        uploadDocument(file, docType);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="space-y-4">
                {profile.documents.length > 0 ? (
                  profile.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {doc.document_name || doc.name || "Document"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Type: {doc.document_type || "N/A"} | Size:{" "}
                              {doc.file_size ? `${(doc.file_size / 1024).toFixed(2)} KB` : "N/A"}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full font-semibold border ${
                                  doc.status === "verified"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : doc.status === "rejected"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                }`}
                              >
                                {doc.status || "Pending"}
                              </span>
                              {doc.uploaded_on && (
                                <span className="text-gray-600">
                                  Uploaded: {new Date(doc.uploaded_on).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </div>
                            {doc.rejection_reason && (
                              <p className="text-sm text-red-600 mt-2">
                                Reason: {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => downloadDocument(doc.id)}
                            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={() =>
                              setShowDeleteConfirm({ type: "document", id: doc.id, index: null })
                            }
                            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                    <label className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload Document
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const docType = prompt("Enter document type (e.g., PAN, Aadhar, KYC):");
                          if (file && docType) {
                            uploadDocument(file, docType);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot
                  be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm({ type: null, id: null, index: null })}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === "bank") {
                    deleteBank(showDeleteConfirm.index);
                  } else if (showDeleteConfirm.type === "nominee") {
                    deleteNominee(showDeleteConfirm.index);
                  } else if (showDeleteConfirm.type === "document") {
                    deleteDocument(showDeleteConfirm.id);
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
