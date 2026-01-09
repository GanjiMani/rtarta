import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function BankMandates() {
  const { fetchWithAuth } = useAuth();
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ 
    account_no: "", 
    ifsc: "", 
    branch: "", 
    bank_name: "",
    account_holder_name: ""
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanks();
  }, [fetchWithAuth]);

  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/profile`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Unable to fetch profile" }));
        throw new Error(errorData.detail || "Unable to fetch profile");
      }
      const response = await res.json();
      const bankAccounts = (response.data?.bank_accounts || []).map(bank => ({
        bank_id: bank.id,
        account_no: bank.account_number || "",
        ifsc: bank.ifsc_code || "",
        branch: bank.branch_name || "",
        bank_name: bank.bank_name || "",
        account_holder_name: bank.account_holder_name || "",
        verified: bank.is_verified || false,
        is_primary: bank.is_primary || false
      }));
      setBanks(bankAccounts);
    } catch (err) {
      setError("Failed to load bank accounts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addBank = async () => {
    if (!form.account_no || !form.ifsc || !form.bank_name) {
      setError("Please enter account number, IFSC code, and bank name");
      setSuccessMsg("");
      return;
    }
    try {
      setError("");
      const payload = {
        account_number: form.account_no,
        account_holder_name: form.account_holder_name || "Account Holder",
        bank_name: form.bank_name,
        branch_name: form.branch || "",
        ifsc_code: form.ifsc,
      };
      const res = await fetchWithAuth(`/api/investor/profile/bank-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to add bank account" }));
        throw new Error(errorData.detail || "Failed to add bank account");
      }
      setSuccessMsg("Bank account added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm({ account_no: "", ifsc: "", branch: "", bank_name: "", account_holder_name: "" });
      // Reload banks
      await fetchBanks();
    } catch (err) {
      setError("Failed to add bank account: " + err.message);
      setSuccessMsg("");
    }
  };

  const removeBank = async (bankId) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) {
      return;
    }
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/bank-accounts/${bankId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to delete bank account" }));
        throw new Error(errorData.detail || "Failed to delete bank account");
      }
      setSuccessMsg("Bank account deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload banks
      await fetchBanks();
    } catch (err) {
      setError("Failed to delete bank account: " + err.message);
      setSuccessMsg("");
    }
  };

  const setPrimary = async (bankId) => {
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/bank-accounts/${bankId}/primary`, {
        method: "PUT",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to set primary bank" }));
        throw new Error(errorData.detail || "Failed to set primary bank");
      }
      setSuccessMsg("Primary bank account updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload banks
      await fetchBanks();
    } catch (err) {
      setError("Failed to set primary bank: " + err.message);
      setSuccessMsg("");
    }
  };

  const verifyBank = async (bankId) => {
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/bank-accounts/${bankId}/verify`, {
        method: "PUT",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to verify bank account" }));
        throw new Error(errorData.detail || "Failed to verify bank account");
      }
      setSuccessMsg("Bank account verified successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload banks
      await fetchBanks();
    } catch (err) {
      setError("Failed to verify bank account: " + err.message);
      setSuccessMsg("");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Bank Account Management</h2>
          <p className="text-gray-600 mt-1">Manage your linked bank accounts</p>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Bank Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                <input
                  placeholder="e.g., State Bank of India"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <input
                  placeholder="Account holder name"
                  value={form.account_holder_name}
                  onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                <input
                  placeholder="Account number"
                  value={form.account_no}
                  onChange={(e) => setForm({ ...form, account_no: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
                <input
                  placeholder="IFSC code"
                  value={form.ifsc}
                  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                <input
                  placeholder="Branch name"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={addBank} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add Bank Account
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Linked Bank Accounts</h3>
            {banks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No bank accounts linked yet.</p>
                <p className="text-sm mt-2">Add a bank account above to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {banks.map((bank) => (
                  <div 
                    key={bank.bank_id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {bank.bank_name || "Bank"}
                          </h4>
                          {bank.is_primary && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Primary
                            </span>
                          )}
                          {bank.verified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Not Verified
                            </span>
                          )}
                        </div>
                        {bank.account_holder_name && (
                          <p className="text-sm text-gray-600 mb-1">
                            Account Holder: {bank.account_holder_name}
                          </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Account:</span> {bank.account_no || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">IFSC:</span> {bank.ifsc || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Branch:</span> {bank.branch || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-wrap">
                        {!bank.verified && (
                          <button
                            onClick={() => verifyBank(bank.bank_id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm"
                          >
                            Verify Account
                          </button>
                        )}
                        {!bank.is_primary && (
                          <button
                            onClick={() => setPrimary(bank.bank_id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                          >
                            Set as Primary
                          </button>
                        )}
                        <button
                          onClick={() => removeBank(bank.bank_id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}