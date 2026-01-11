import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { User, CreditCard, Users, FileText, CheckCircle, X, Edit2, Trash2, Plus, Download, Upload, AlertCircle, ShieldCheck } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative px-6 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Investor Profile</h1>
                <p className="text-emerald-50/80 text-lg mt-1 font-medium">
                  Manage your personal security and investment identity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border backdrop-blur-md shadow-sm ${profile.kyc_status?.toLowerCase() === 'verified'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-50'
                : 'bg-amber-500/20 border-amber-400 text-amber-50'
                }`}>
                KYC: {profile.kyc_status?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
              </span>
            </div>
          </div>
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
        <div className="bg-white/80 backdrop-blur-md sticky top-4 z-20 rounded-2xl shadow-lg border border-slate-200 mb-8 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
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
                  className={`flex items-center gap-2.5 px-8 py-5 font-bold text-sm transition-all relative whitespace-nowrap ${isActive
                    ? "text-emerald-700 bg-emerald-50/50"
                    : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 min-h-[600px]">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800">Personal Identity</h2>
                  <p className="text-slate-500 mt-1 font-medium">Verify and update your basic identification details</p>
                </div>
                {!personalEdit && (
                  <button
                    onClick={() => setPersonalEdit(true)}
                    className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {personalEdit ? (
                <div className="space-y-8 max-w-4xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        PAN Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pan_number"
                        value={profile.pan_number}
                        onChange={handleFieldChange}
                        maxLength="10"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase tracking-widest"
                        placeholder="ABCDE1234F"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={profile.date_of_birth}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-8 mt-4">
                    <button
                      onClick={savePersonal}
                      className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Commit Changes
                    </button>
                    <button
                      onClick={() => {
                        setPersonalEdit(false);
                        fetchProfile();
                      }}
                      className="px-8 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legal Name</p>
                    <p className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors uppercase">{profile.full_name || "N/A"}</p>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PAN Account Number</p>
                    <p className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors tracking-widest">{profile.pan_number || "N/A"}</p>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</p>
                    <p className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {profile.date_of_birth
                        ? new Date(profile.date_of_birth).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender Identification</p>
                    <p className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors capitalize">
                      {profile.gender || "N/A"}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verification Status</p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${getKYCStatusBadge(
                          profile.kyc_status
                        )}`}
                      >
                        {profile.kyc_status?.toLowerCase() === 'verified' && <CheckCircle className="w-4 h-4" />}
                        {profile.kyc_status?.replace('_', ' ').toUpperCase() || "NOT STARTED"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Investor ID</p>
                    <p className="text-lg font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg inline-block">{profile.investor_id || "N/A"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === "contact" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800">Contact Details</h2>
                  <p className="text-slate-500 mt-1 font-medium">Keep your reachability information up to date</p>
                </div>
                {!contactEdit && (
                  <button
                    onClick={() => setContactEdit(true)}
                    className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    Update Contact
                  </button>
                )}
              </div>

              {contactEdit ? (
                <div className="space-y-8 max-w-4xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Primary Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="email@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile_number"
                        value={profile.mobile_number}
                        onChange={handleFieldChange}
                        maxLength="10"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="9999999999"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Residence Address Line 1
                      </label>
                      <input
                        type="text"
                        name="address_line1"
                        value={profile.address_line1}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="House No., Street Name"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">
                        Residence Address Line 2
                      </label>
                      <input
                        type="text"
                        name="address_line2"
                        value={profile.address_line2}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="Locality, Landmark"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">City / Town</label>
                      <input
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="City Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">State / Province</label>
                      <input
                        type="text"
                        name="state"
                        value={profile.state}
                        onChange={handleFieldChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="State Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">Postal Code (Pincode)</label>
                      <input
                        type="text"
                        name="pincode"
                        value={profile.pincode}
                        onChange={handleFieldChange}
                        maxLength="6"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="600001"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-8 mt-4">
                    <button
                      onClick={saveContact}
                      className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Save Address
                    </button>
                    <button
                      onClick={() => {
                        setContactEdit(false);
                        fetchProfile();
                      }}
                      className="px-8 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</p>
                    <p className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors break-all">{profile.email || "N/A"}</p>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Phone</p>
                    <p className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors tracking-widest">{profile.mobile_number || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Residential Address</p>
                    <p className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-relaxed">
                      {[profile.address_line1, profile.address_line2, profile.city, profile.state, profile.pincode]
                        .filter(Boolean)
                        .join(", ") || "No address provided."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Accounts Tab */}
          {activeTab === "banks" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800">Financial Mandates</h2>
                  <p className="text-slate-500 mt-1 font-medium">Link and verify your registered bank accounts</p>
                </div>
                <button
                  onClick={addBank}
                  className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Link New Bank
                </button>
              </div>

              <div className="space-y-6">
                {profile.bank_accounts.length > 0 ? (
                  profile.bank_accounts.map((bank, index) =>
                    bankEditIndex === index ? (
                      <div key={index} className="bg-slate-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-inner animate-pulse-subtle">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">
                            {bank.id ? "Edit Banking Details" : "New Account Configuration"}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Account Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="account_number"
                              value={bank.account_number || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="000000000000"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Holder Name as per Bank <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="account_holder_name"
                              value={bank.account_holder_name || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="Full Name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Banking Institution <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="bank_name"
                              value={bank.bank_name || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="e.g. HDFC Bank"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              IFSC Routing Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="ifsc_code"
                              value={bank.ifsc_code || bank.ifsc || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase tracking-widest"
                              placeholder="HDFC0000001"
                              maxLength="11"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Branch Designation
                            </label>
                            <input
                              type="text"
                              name="branch_name"
                              value={bank.branch_name || bank.branch || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="Branch Name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Account Classification
                            </label>
                            <select
                              name="account_type"
                              value={bank.account_type || "savings"}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                            >
                              <option value="savings">Savings Account</option>
                              <option value="current">Current Account</option>
                              <option value="nri_nro">NRI NRO Account</option>
                              <option value="nri_nre">NRI NRE Account</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Bank Address
                            </label>
                            <input
                              type="text"
                              name="bank_address"
                              value={bank.bank_address || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="Street, Area"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">City</label>
                            <input
                              type="text"
                              name="city"
                              value={bank.city || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">State</label>
                            <input
                              type="text"
                              name="state"
                              value={bank.state || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="State"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Pincode</label>
                            <input
                              type="text"
                              name="pincode"
                              value={bank.pincode || ""}
                              onChange={(e) => handleFieldChange(e, "bank", index)}
                              maxLength="6"
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="600001"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-10 pt-8 border-t border-slate-200">
                          <button
                            onClick={() => saveBank(index)}
                            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Secure Account
                          </button>
                          <button
                            onClick={() => {
                              setBankEditIndex(-1);
                              fetchProfile();
                            }}
                            className="px-8 py-3.5 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all active:scale-95"
                          >
                            Discard
                          </button>
                          {bank.id && (
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "bank", id: bank.id, index })
                              }
                              className="px-6 py-3.5 border-2 border-rose-100 text-rose-600 font-bold rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-2 ml-auto active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove Link
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="group bg-white rounded-3xl p-8 border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                              <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                                <CreditCard className="w-8 h-8 text-emerald-600" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                                  {bank.bank_name || "Unspecified Bank"}
                                  {bank.is_primary && (
                                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-tighter shadow-sm shadow-emerald-200">
                                      Primary Account
                                    </span>
                                  )}
                                </h3>
                                <p className="text-slate-500 font-bold tracking-tight">
                                  {bank.account_holder_name || "Verification Pending"}
                                </p>
                              </div>
                              <div className="lg:ml-auto">
                                {bank.is_verified ? (
                                  <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-black shadow-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    VERIFIED
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-sm font-black shadow-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    PENDING VERIFICATION
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Number</p>
                                <p className="text-base font-mono font-black text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                                  •••• •••• {bank.account_number?.slice(-4) || "XXXX"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">IFSC Routing</p>
                                <p className="text-base font-bold text-slate-700 tracking-wider">
                                  {bank.ifsc_code || bank.ifsc || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Branch</p>
                                <p className="text-base font-bold text-slate-700">
                                  {bank.branch_name || bank.branch || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</p>
                                <p className="text-base font-bold text-emerald-700 capitalize">
                                  {bank.account_type || "Savings"}
                                </p>
                              </div>
                            </div>

                            {(bank.bank_address || bank.city) && (
                              <div className="mt-4 px-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Location</p>
                                <p className="text-sm font-medium text-slate-600">
                                  {[bank.bank_address, bank.city, bank.state, bank.pincode].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row lg:flex-col items-center justify-end gap-3 min-w-[160px]">
                            {!bank.is_primary && (
                              <button
                                onClick={() => setPrimaryBank(bank.id)}
                                className="flex-1 lg:w-full px-5 py-3 text-sm font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95"
                              >
                                Make Primary
                              </button>
                            )}
                            <button
                              onClick={() => setBankEditIndex(index)}
                              className="flex-1 lg:w-full px-5 py-3 text-sm font-bold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                              <Edit2 className="w-4 h-4" />
                              Modify
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "bank", id: bank.id, index })
                              }
                              className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-rose-100"
                              title="Delete Account"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-24 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[2.5rem]">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-8">
                      <CreditCard className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">No Registered Banks</h3>
                    <p className="text-slate-500 font-medium mb-10 max-w-xs mx-auto">Please add a bank account to enable seamless fund transfers and redemptions.</p>
                    <button
                      onClick={addBank}
                      className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-3 mx-auto active:scale-95"
                    >
                      <Plus className="w-6 h-6" />
                      Add Account Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nominees Tab */}
          {activeTab === "nominees" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800">Nomination Rights</h2>
                  <p className="text-slate-500 mt-1 font-medium">Designate beneficiaries for your investment portfolio</p>
                </div>
                <button
                  onClick={addNominee}
                  className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Nominee
                </button>
              </div>

              <div className="space-y-6">
                {profile.nominees.length > 0 ? (
                  profile.nominees.map((nominee, index) =>
                    nomineeEditIndex === index ? (
                      <div key={index} className="bg-slate-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-inner animate-pulse-subtle">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Users className="w-5 h-5 text-emerald-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">
                            {nominee.id ? "Update Nominee Profile" : "New Nominee Declaration"}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Nominee Legal Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="nominee_name"
                              value={nominee.nominee_name || nominee.name || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="Full Name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Familial Relationship <span className="text-rose-500">*</span>
                            </label>
                            <select
                              name="relationship"
                              value={nominee.relationship || nominee.nominee_relationship || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
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
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Date of Birth <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="date_of_birth"
                              value={nominee.date_of_birth || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Asset Allocation (%) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                name="allocation_percentage"
                                value={nominee.allocation_percentage || nominee.pct || 100}
                                onChange={(e) => handleFieldChange(e, "nominee", index)}
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-emerald-700 pr-12"
                                required
                              />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Contact Mobile
                            </label>
                            <input
                              type="tel"
                              name="mobile_number"
                              value={nominee.mobile_number || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="9999999999"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={nominee.email || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="nominee@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Nominee PAN
                            </label>
                            <input
                              type="text"
                              name="nominee_pan"
                              value={nominee.nominee_pan || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              maxLength="10"
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase tracking-widest"
                              placeholder="ABCDE1234F"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Nominee Gender
                            </label>
                            <select
                              name="gender"
                              value={nominee.gender || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                            >
                              <option value="">-- Select Gender --</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-slate-700 ml-1">
                              Nominee Address
                            </label>
                            <input
                              type="text"
                              name="address"
                              value={nominee.address || ""}
                              onChange={(e) => handleFieldChange(e, "nominee", index)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                              placeholder="Full Address"
                            />
                          </div>

                          <div className="md:col-span-2 py-4">
                            <div className="h-px bg-slate-200 w-full mb-8"></div>
                            <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-emerald-600" />
                              Guardian Details (For Minor Nominees)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Guardian Name</label>
                                <input
                                  type="text"
                                  name="guardian_name"
                                  value={nominee.guardian_name || ""}
                                  onChange={(e) => handleFieldChange(e, "nominee", index)}
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                                  placeholder="Guardian's Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Guardian Relation</label>
                                <input
                                  type="text"
                                  name="guardian_relation"
                                  value={nominee.guardian_relation || nominee.guardian_relationship || ""}
                                  onChange={(e) => handleFieldChange(e, "nominee", index)}
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                                  placeholder="Father/Mother/Other"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Guardian PAN</label>
                                <input
                                  type="text"
                                  name="guardian_pan"
                                  value={nominee.guardian_pan || ""}
                                  onChange={(e) => handleFieldChange(e, "nominee", index)}
                                  maxLength="10"
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase tracking-widest"
                                  placeholder="ABCDE1234F"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-10 pt-8 border-t border-slate-200">
                          <button
                            onClick={() => saveNominee(index)}
                            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Secure Nominee
                          </button>
                          <button
                            onClick={() => {
                              setNomineeEditIndex(-1);
                              fetchProfile();
                            }}
                            className="px-8 py-3.5 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all active:scale-95"
                          >
                            Discard
                          </button>
                          {nominee.id && (
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "nominee", id: nominee.id, index })
                              }
                              className="px-6 py-3.5 border-2 border-rose-100 text-rose-600 font-bold rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-2 ml-auto active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="group bg-white rounded-3xl p-8 border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                              <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors">
                                <Users className="w-8 h-8 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                                  {nominee.nominee_name || nominee.name || "Designated Nominee"}
                                </h3>
                                <p className="text-slate-500 font-bold tracking-tight">
                                  {nominee.relationship || nominee.nominee_relationship || "Family Member"}
                                </p>
                              </div>
                              <div className="lg:ml-auto">
                                <span className="flex flex-col items-end">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Benefit Allocation</p>
                                  <p className="text-2xl font-black text-emerald-600 font-mono">
                                    {nominee.allocation_percentage || nominee.pct || 0}%
                                  </p>
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date of Birth</p>
                                <p className="text-base font-bold text-slate-700">
                                  {nominee.date_of_birth
                                    ? new Date(nominee.date_of_birth).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PAN & Gender</p>
                                <p className="text-sm font-bold text-slate-700 uppercase">
                                  {nominee.nominee_pan || "No PAN"} | {nominee.gender || "NA"}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact Details</p>
                                <p className="text-sm font-bold text-slate-700 truncate">
                                  {nominee.mobile_number || nominee.email ? (
                                    <>
                                      {nominee.mobile_number} {nominee.email && `| ${nominee.email}`}
                                    </>
                                  ) : "No contact verified"}
                                </p>
                              </div>
                            </div>

                            {nominee.address && (
                              <div className="mt-4 px-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Residential Address</p>
                                <p className="text-sm font-medium text-slate-600 truncate">{nominee.address}</p>
                              </div>
                            )}

                            {nominee.guardian_name && (
                              <div className="mt-4 px-4 py-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Legal Guardian</p>
                                <p className="text-sm font-bold text-slate-800">
                                  {nominee.guardian_name} ({nominee.guardian_relation || nominee.guardian_relationship || "Guardian"})
                                  {nominee.guardian_pan && <span className="ml-2 text-slate-500 font-mono text-xs">| {nominee.guardian_pan}</span>}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row lg:flex-col items-center justify-end gap-3 min-w-[160px]">
                            <button
                              onClick={() => setNomineeEditIndex(index)}
                              className="flex-1 lg:w-full px-5 py-3 text-sm font-bold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                              <Edit2 className="w-4 h-4" />
                              Modify
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm({ type: "nominee", id: nominee.id, index })
                              }
                              className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-rose-100"
                              title="Remove Nominee"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-24 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[2.5rem]">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-8">
                      <Users className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">No Nominees Declared</h3>
                    <p className="text-slate-500 font-medium mb-10 max-w-xs mx-auto">Nomination is critical for the smooth transfer of assets to your loved ones.</p>
                    <button
                      onClick={addNominee}
                      className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-3 mx-auto active:scale-95"
                    >
                      <Plus className="w-6 h-6" />
                      Add Nominee Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800">Secure Vault</h2>
                  <p className="text-slate-500 mt-1 font-medium">Verify and manage your essential legal documentation</p>
                </div>
                <label className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 cursor-pointer active:scale-95">
                  <Upload className="w-4 h-4" />
                  Upload Document
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const docType = prompt("Enter document type (e.g., PAN, Aadhar, KYC, Canceled Cheque):");
                      if (file && docType) {
                        uploadDocument(file, docType);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.documents.length > 0 ? (
                  profile.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                          <FileText className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-extrabold text-slate-800 mb-1 truncate">
                            {doc.document_name || doc.name || "Legal Document"}
                          </h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {doc.document_type || "General Type"} • {(doc.file_size / 1024).toFixed(1)} KB
                          </p>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${doc.status === "verified"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : doc.status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                            >
                              {doc.status || "In Review"}
                            </span>
                            {doc.uploaded_on && (
                              <span className="text-[10px] font-bold text-slate-400">
                                {new Date(doc.uploaded_on).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => downloadDocument(doc.id)}
                            className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              setShowDeleteConfirm({ type: "document", id: doc.id, index: null })
                            }
                            className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                            title="Remove"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {doc.rejection_reason && (
                        <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <p className="text-xs font-bold text-rose-700 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {doc.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 text-center py-20 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[2.5rem]">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Documents Archived</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">Digitize your investment journey by uploading identity and address proofs.</p>
                    <label className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 cursor-pointer active:scale-95">
                      <Upload className="w-5 h-5" />
                      Upload First File
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const docType = prompt("Enter document type:");
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Irreversible Action</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                You are about to permanently remove this <span className="text-slate-800 font-bold">{showDeleteConfirm.type}</span> record. This action cannot be undone. Are you absolutely certain?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeleteConfirm({ type: null, id: null, index: null })}
                className="px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Refuse
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
                className="px-6 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
