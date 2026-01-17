import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { CreditCard, CheckCircle, Edit2, Trash2, Plus, AlertCircle, ArrowLeft } from "lucide-react";

export default function BankAccounts() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [bankEditIndex, setBankEditIndex] = useState(-1);
  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => { if (fetchWithAuth) fetchBankAccounts(); }, [fetchWithAuth]);

  const fetchBankAccounts = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setBankAccounts(data.data?.bank_accounts || []);
    } catch (err) { setError("Failed to load accounts"); } finally { setLoading(false); }
  };

  const saveBank = async (index) => {
    try {
      const bank = bankAccounts[index];
      const isNew = !bank.id;
      const res = await fetchWithAuth(isNew ? "/api/investor/profile/bank-accounts" : `/api/investor/profile/bank-accounts/${bank.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bank),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg(isNew ? "Added!" : "Updated!"); setTimeout(() => setSuccessMsg(""), 3000);
      setBankEditIndex(-1); fetchBankAccounts();
    } catch (err) { setError("Save failed"); }
  };

  const deleteBank = async (index) => {
    if (!window.confirm("Delete account?")) return;
    try {
      const bank = bankAccounts[index];
      if (bank.id) await fetchWithAuth(`/api/investor/profile/bank-accounts/${bank.id}`, { method: "DELETE" });
      fetchBankAccounts();
    } catch (err) { setError("Delete failed"); }
  };

  const setPrimary = async (id) => {
    try {
      await fetchWithAuth(`/api/investor/profile/bank-accounts/${id}/primary`, { method: "PUT" });
      fetchBankAccounts();
    } catch (err) { setError("Failed to set primary"); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bank Accounts</h1>
            <p className="text-gray-500 text-sm">Manage your linked bank accounts.</p>
          </div>
        </div>
        <button onClick={() => { setBankAccounts([...bankAccounts, {}]); setBankEditIndex(bankAccounts.length); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> Add Bank</button>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-2 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map((bank, i) => (
            <div key={i} className={`border border-gray-100 rounded-lg p-4 shadow-sm ${bankEditIndex === i ? 'ring-2 ring-blue-500' : ''}`}>
              {bankEditIndex === i ? (
                <div className="space-y-3">
                  <input className="w-full p-2 border border-gray-200 rounded text-sm" placeholder="Bank Name" value={bank.bank_name || ""} onChange={e => { const n = [...bankAccounts]; n[i].bank_name = e.target.value; setBankAccounts(n) }} />
                  <input className="w-full p-2 border border-gray-200 rounded text-sm" placeholder="Account Number" value={bank.account_number || ""} onChange={e => { const n = [...bankAccounts]; n[i].account_number = e.target.value; setBankAccounts(n) }} />
                  <input className="w-full p-2 border border-gray-200 rounded text-sm" placeholder="Holder Name" value={bank.account_holder_name || ""} onChange={e => { const n = [...bankAccounts]; n[i].account_holder_name = e.target.value; setBankAccounts(n) }} />
                  <input className="w-full p-2 border border-gray-200 rounded text-sm uppercase" placeholder="IFSC" value={bank.ifsc_code || bank.ifsc || ""} onChange={e => { const n = [...bankAccounts]; n[i].ifsc_code = e.target.value; setBankAccounts(n) }} />
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => { setBankEditIndex(-1); fetchBankAccounts() }} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-xs">Cancel</button>
                    <button onClick={() => saveBank(i)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs">Save</button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{bank.bank_name || "New Bank"}</div>
                      <div className="text-xs text-gray-500">****{bank.account_number?.slice(-4)}</div>
                    </div>
                    {bank.is_primary && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Primary</span>}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">{bank.account_holder_name}</div>
                  <div className="flex gap-2 border-t border-gray-50 pt-3">
                    {!bank.is_primary && <button onClick={() => setPrimary(bank.id)} className="text-xs text-blue-600 hover:underline">Make Primary</button>}
                    <button onClick={() => setBankEditIndex(i)} className="text-xs text-gray-500 hover:text-gray-900 ml-auto flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                    <button onClick={() => deleteBank(i)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!bankAccounts.length && <div className="col-span-2 p-8 text-center text-gray-500 border border-gray-100 border-dashed rounded-lg">No bank accounts linked.</div>}
        </div>
      )}
    </div>
  );
}
