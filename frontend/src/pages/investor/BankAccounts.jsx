import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { CreditCard, CheckCircle, Edit2, Trash2, Plus, AlertCircle } from "lucide-react";

export default function BankAccounts() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [bankEditIndex, setBankEditIndex] = useState(-1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState({ type: null, id: null, index: null });
  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchBankAccounts();
    }
  }, [fetchWithAuth]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      const profileData = data.data || {};
      setBankAccounts(profileData.bank_accounts || []);
    } catch (err) {
      setError("Failed to load bank accounts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e, index) => {
    const { name, value } = e.target;
    const newBanks = [...bankAccounts];
    newBanks[index] = { ...newBanks[index], [name]: value };
    setBankAccounts(newBanks);
  };

  const saveBank = async (index) => {
    try {
      const bank = bankAccounts[index];
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
      fetchBankAccounts();
    } catch (err) {
      setError(err.message || "Failed to save bank account");
    }
  };

  const deleteBank = async (index) => {
    try {
      const bank = bankAccounts[index];
      if (!bank.id) {
        setBankAccounts((prev) => prev.filter((_, i) => i !== index));
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
      fetchBankAccounts();
    } catch (err) {
      setError(err.message || "Failed to delete bank account");
      setShowDeleteConfirm({ type: null, id: null, index: null });
    }
  };

  const setPrimaryBank = async (accountId) => {
    try {
      const response = await fetchWithAuth(`/api/investor/profile/bank-accounts/${accountId}/primary`, {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Failed to set primary bank account");

      setSuccessMsg("Primary bank account updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchBankAccounts();
    } catch (err) {
      setError(err.message || "Failed to set primary bank account");
    }
  };

  const addBank = () => {
    setBankAccounts((prev) => [
      ...prev,
      {
        account_number: "",
        account_holder_name: "",
        bank_name: "",
        branch_name: "",
        ifsc_code: "",
        account_type: "savings",
      },
    ]);
    setBankEditIndex(bankAccounts.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Accounts</h1>
          <p className="text-gray-600">
            Link and verify your registered bank accounts
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
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Bank Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={addBank}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Link New Bank
          </button>
        </div>

        {/* Bank Accounts List */}
        {loading ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bank accounts...</p>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center">
            <CreditCard className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Registered Banks</h3>
            <p className="text-gray-500 mb-6">
              Please add a bank account to enable seamless fund transfers and redemptions.
            </p>
            <button
              onClick={addBank}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Account Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bankAccounts.map((bank, index) =>
              bankEditIndex === index ? (
                <div key={index} className="bg-white shadow-lg rounded-xl p-8 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {bank.id ? "Edit Banking Details" : "New Account Configuration"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="account_number"
                        value={bank.account_number || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="000000000000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Holder Name as per Bank <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="account_holder_name"
                        value={bank.account_holder_name || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Banking Institution <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={bank.bank_name || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. HDFC Bank"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        IFSC Routing Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="ifsc_code"
                        value={bank.ifsc_code || bank.ifsc || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                        placeholder="HDFC0000001"
                        maxLength="11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Branch Designation</label>
                      <input
                        type="text"
                        name="branch_name"
                        value={bank.branch_name || bank.branch || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Branch Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Account Classification</label>
                      <select
                        name="account_type"
                        value={bank.account_type || "savings"}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="savings">Savings Account</option>
                        <option value="current">Current Account</option>
                        <option value="nri_nro">NRI NRO Account</option>
                        <option value="nri_nre">NRI NRE Account</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Bank Address</label>
                      <input
                        type="text"
                        name="bank_address"
                        value={bank.bank_address || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Street, Area"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">City</label>
                      <input
                        type="text"
                        name="city"
                        value={bank.city || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">State</label>
                      <input
                        type="text"
                        name="state"
                        value={bank.state || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={bank.pincode || ""}
                        onChange={(e) => handleFieldChange(e, index)}
                        maxLength="6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="600001"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => saveBank(index)}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Save Account
                    </button>
                    <button
                      onClick={() => {
                        setBankEditIndex(-1);
                        fetchBankAccounts();
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    {bank.id && (
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "bank", id: bank.id, index })}
                        className="px-6 py-3 border-2 border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            {bank.bank_name || "Unspecified Bank"}
                            {bank.is_primary && (
                              <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-bold uppercase">
                                Primary
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-600">{bank.account_holder_name || "Verification Pending"}</p>
                        </div>
                        <div className="lg:ml-auto">
                          {bank.is_verified ? (
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded text-sm font-semibold">
                              <AlertCircle className="w-4 h-4" />
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Account Number</p>
                          <p className="font-mono font-medium text-gray-900">
                            •••• •••• {bank.account_number?.slice(-4) || "XXXX"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">IFSC Code</p>
                          <p className="font-medium text-gray-900">{bank.ifsc_code || bank.ifsc || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Branch</p>
                          <p className="font-medium text-gray-900">{bank.branch_name || bank.branch || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Type</p>
                          <p className="font-medium text-blue-700 capitalize">{bank.account_type || "Savings"}</p>
                        </div>
                      </div>

                      {(bank.bank_address || bank.city) && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 uppercase mb-1">Location</p>
                          <p className="text-sm text-gray-700">
                            {[bank.bank_address, bank.city, bank.state, bank.pincode].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-3">
                      {!bank.is_primary && (
                        <button
                          onClick={() => setPrimaryBank(bank.id)}
                          className="flex-1 lg:w-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        onClick={() => setBankEditIndex(index)}
                        className="flex-1 lg:w-full px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "bank", id: bank.id, index })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Account"
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
        {showDeleteConfirm.type === "bank" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this bank account? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm({ type: null, id: null, index: null })}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteBank(showDeleteConfirm.index)}
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
