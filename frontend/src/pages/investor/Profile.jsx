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
      // setError("Failed to load profile: " + err.message);
      // Suppress error on first load if it's 404 or empty
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
      // setError("Failed to load documents: " + err.message);
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
    } catch (err) {
      setError(err.message || "Failed to delete document");
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
    const s = status?.toLowerCase() || "";
    if (s === "verified") return "bg-green-100 text-green-700 border-green-200";
    if (s === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header */}
      <div className="mb-8 border-b border-gray-100 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Investor Profile</h1>
            <p className="text-gray-500 mt-1">Manage your personal and investment details</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getKYCStatusBadge(profile.kyc_status)}`}>
            KYC: {profile.kyc_status?.replace('_', ' ') || "PENDING"}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-lg flex items-center gap-3 text-red-700">
          <X className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-4xl">
          {activeTab === "personal" && (
            <div className="p-6 border border-gray-100 rounded-xl shadow-sm bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                {!personalEdit && (
                  <button onClick={() => setPersonalEdit(true)} className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>

              {personalEdit ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" name="full_name" value={profile.full_name} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                      <input type="text" name="pan_number" value={profile.pan_number} onChange={handleFieldChange} maxLength="10" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" name="date_of_birth" value={profile.date_of_birth} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select name="gender" value={profile.gender} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={savePersonal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
                    <button onClick={() => setPersonalEdit(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Full Name</p>
                    <p className="text-gray-900 font-medium">{profile.full_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">PAN</p>
                    <p className="text-gray-900 font-medium uppercase">{profile.pan_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">DOB</p>
                    <p className="text-gray-900 font-medium">{profile.date_of_birth || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Gender</p>
                    <p className="text-gray-900 font-medium capitalize">{profile.gender || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="p-6 border border-gray-100 rounded-xl shadow-sm bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Contact Details</h3>
                {!contactEdit && (
                  <button onClick={() => setContactEdit(true)} className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
              {contactEdit ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" name="email" value={profile.email} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input type="tel" name="mobile_number" value={profile.mobile_number} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                      <input type="text" name="address_line1" value={profile.address_line1} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                      <input type="text" name="address_line2" value={profile.address_line2} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" name="city" value={profile.city} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input type="text" name="state" value={profile.state} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input type="text" name="pincode" value={profile.pincode} onChange={handleFieldChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={saveContact} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
                    <button onClick={() => setContactEdit(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                    <p className="text-gray-900 font-medium">{profile.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Mobile</p>
                    <p className="text-gray-900 font-medium">{profile.mobile_number || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
                    <p className="text-gray-900 font-medium">
                      {[profile.address_line1, profile.address_line2, profile.city, profile.state, profile.pincode].filter(Boolean).join(", ") || "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "banks" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Bank Accounts</h3>
                <button onClick={addBank} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Plus size={16} /> Add Bank
                </button>
              </div>
              {profile.bank_accounts.map((bank, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                  {bankEditIndex === index ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bank Edit Fields - Simplified */}
                        <input className="border p-2 rounded" name="account_number" placeholder="Account Number" value={bank.account_number} onChange={(e) => handleFieldChange(e, "bank", index)} />
                        <input className="border p-2 rounded" name="account_holder_name" placeholder="Holder Name" value={bank.account_holder_name} onChange={(e) => handleFieldChange(e, "bank", index)} />
                        <input className="border p-2 rounded" name="bank_name" placeholder="Bank Name" value={bank.bank_name} onChange={(e) => handleFieldChange(e, "bank", index)} />
                        <input className="border p-2 rounded" name="ifsc_code" placeholder="IFSC" value={bank.ifsc_code || bank.ifsc} onChange={(e) => handleFieldChange(e, "bank", index)} />
                        <input className="border p-2 rounded" name="branch_name" placeholder="Branch" value={bank.branch_name || bank.branch} onChange={(e) => handleFieldChange(e, "bank", index)} />
                        <select className="border p-2 rounded" name="account_type" value={bank.account_type} onChange={(e) => handleFieldChange(e, "bank", index)}>
                          <option value="savings">Savings</option>
                          <option value="current">Current</option>
                          <option value="nri_nro">NRI NRO</option>
                          <option value="nri_nre">NRI NRE</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveBank(index)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save</button>
                        <button onClick={() => { setBankEditIndex(-1); fetchProfile(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{bank.bank_name || "Bank Name"}</h4>
                        <p className="text-gray-500 text-sm">{bank.account_number} • {bank.account_type}</p>
                        <p className="text-gray-500 text-sm">{bank.ifsc_code || bank.ifsc}</p>
                        {bank.is_primary && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-2 inline-block">Primary</span>}
                      </div>
                      <div className="flex gap-2">
                        {!bank.is_primary && <button onClick={() => setPrimaryBank(bank.id)} className="text-xs text-blue-600 underline">Make Primary</button>}
                        <button onClick={() => setBankEditIndex(index)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                        {bank.id && <button onClick={() => deleteBank(index)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "nominees" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Nominees</h3>
                <button onClick={addNominee} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Plus size={16} /> Add Nominee
                </button>
              </div>
              {profile.nominees.map((nom, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                  {nomineeEditIndex === index ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="border p-2 rounded" name="nominee_name" placeholder="Name" value={nom.nominee_name || nom.name} onChange={(e) => handleFieldChange(e, "nominee", index)} />
                        <select className="border p-2 rounded" name="relationship" value={nom.relationship || nom.nominee_relationship} onChange={(e) => handleFieldChange(e, "nominee", index)}>
                          <option value="">Select Relation</option>
                          {nomineeRelations.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input type="date" className="border p-2 rounded" name="date_of_birth" value={nom.date_of_birth} onChange={(e) => handleFieldChange(e, "nominee", index)} />
                        <input type="number" className="border p-2 rounded" name="allocation_percentage" placeholder="%" value={nom.allocation_percentage || nom.pct} onChange={(e) => handleFieldChange(e, "nominee", index)} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveNominee(index)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save</button>
                        <button onClick={() => { setNomineeEditIndex(-1); fetchProfile(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{nom.nominee_name || nom.name}</h4>
                        <p className="text-sm text-gray-500">{nom.relationship || nom.nominee_relationship} • {nom.allocation_percentage || nom.pct}% Share</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setNomineeEditIndex(index)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                        {nom.id && <button onClick={() => deleteNominee(index)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                <label className="cursor-pointer flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Upload size={16} /> Upload
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    const docType = prompt("Document Type:");
                    if (file && docType) uploadDocument(file, docType);
                  }} />
                </label>
              </div>
              {profile.documents.map(doc => (
                <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_name || doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.document_type} • {doc.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadDocument(doc.id)} className="text-gray-400 hover:text-blue-600"><Download size={16} /></button>
                    <button onClick={() => deleteDocument(doc.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
