import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Building2,
  User,
  CreditCard,
  Layers,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Globe,
  MapPin,
  Lock,
  ArrowRight,
  Zap,
  Clock,
  History,
  Activity
} from "lucide-react";

export default function BankMandates() {
  const { fetchWithAuth } = useAuth();
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    bank_name: "",
    account_holder_name: "",
    account_type: "savings",
    bank_address: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mandateLoading, setMandateLoading] = useState({}); // Tracking loading state for individual mandate actions
  const [showMandateModal, setShowMandateModal] = useState(null); // ID of bank for which mandate modal is shown
  const [mandateForm, setMandateForm] = useState({
    mandate_type: "net_banking",
    mandate_amount_limit: 100000,
    mandate_expiry_date: "",
    upi_id: ""
  });

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
        account_number: bank.account_number || "",
        ifsc_code: bank.ifsc_code || "",
        branch_name: bank.branch_name || "",
        bank_name: bank.bank_name || "",
        account_holder_name: bank.account_holder_name || "",
        account_type: bank.account_type || "savings",
        bank_address: bank.bank_address || "",
        city: bank.city || "",
        state: bank.state || "",
        pincode: bank.pincode || "",
        verified: bank.is_verified || false,
        is_primary: bank.is_primary || false,
        mandate_type: bank.mandate_type || null,
        mandate_status: bank.mandate_status || "inactive",
        mandate_umrn: bank.mandate_umrn || null,
        mandate_limit: bank.mandate_amount_limit || 0
      }));
      setBanks(bankAccounts);
    } catch (err) {
      setError("Failed to load bank accounts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addBank = async (e) => {
    e?.preventDefault();
    if (!form.account_number || !form.ifsc_code || !form.bank_name) {
      setError("Bank Name, Account Number, and IFSC are strictly required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        account_number: form.account_number,
        account_holder_name: form.account_holder_name || "Account Holder",
        bank_name: form.bank_name,
        branch_name: form.branch_name || "",
        ifsc_code: form.ifsc_code,
        account_type: form.account_type,
        bank_address: form.bank_address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
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
      setSuccessMsg("Financial instrument securely linked and archived.");
      setTimeout(() => setSuccessMsg(""), 5000);
      setForm({
        account_number: "",
        ifsc_code: "",
        branch_name: "",
        bank_name: "",
        account_holder_name: "",
        account_type: "savings",
        bank_address: "",
        city: "",
        state: "",
        pincode: ""
      });
      await fetchBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeBank = async (bankId) => {
    if (!window.confirm("This action will permanently delink this bank account. Proceed?")) {
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
      setSuccessMsg("Bank account successfully removed from your vault.");
      setTimeout(() => setSuccessMsg(""), 5000);
      await fetchBanks();
    } catch (err) {
      setError(err.message);
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
      setSuccessMsg("Primary settlement account updated successfully.");
      setTimeout(() => setSuccessMsg(""), 5000);
      await fetchBanks();
    } catch (err) {
      setError(err.message);
    }
  };

  const registerMandate = async (bankId) => {
    setMandateLoading(prev => ({ ...prev, [bankId]: true }));
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_account_id: bankId,
          ...mandateForm
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to register mandate" }));
        throw new Error(errorData.detail || "Failed to register mandate");
      }
      setSuccessMsg("Mandate registration initiated. UMRN generated.");
      setShowMandateModal(null);
      await fetchBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setMandateLoading(prev => ({ ...prev, [bankId]: false }));
    }
  };

  const activateMandate = async (bankId) => {
    setMandateLoading(prev => ({ ...prev, [bankId]: true }));
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/mandates/verify/${bankId}`, {
        method: "PUT",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to activate mandate" }));
        throw new Error(errorData.detail || "Failed to activate mandate");
      }
      setSuccessMsg("Mandate successfully activated and ready for systematic investments.");
      await fetchBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setMandateLoading(prev => ({ ...prev, [bankId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
          <Building2 className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Accessing Bank Vault</h2>
        <p className="text-slate-500 font-medium mt-2">One moment while we prepare your mandates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-400/30 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span className="text-[10px] font-black uppercase text-emerald-100 tracking-[0.2em]">Verified Gateway</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
                Bank Mandates
              </h1>
              <p className="text-emerald-50/80 font-medium max-w-xl text-lg leading-relaxed">
                Configure your settlement channels and investment liquidity anchors.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-white/20">
              <div className="p-3 bg-emerald-500/30 rounded-2xl">
                <Building2 className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-100/60 uppercase tracking-widest">Linked Entities</p>
                <p className="text-2xl font-black text-white">{banks.length} <span className="text-sm font-normal text-emerald-100">Accounts</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 space-y-8">
        {/* Messages */}
        {(error || successMsg) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {error && (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-5 rounded-3xl text-rose-800 shadow-xl shadow-rose-900/5">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="font-bold">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-5 rounded-3xl text-emerald-800 shadow-xl shadow-emerald-900/5">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-bold">{successMsg}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Bank Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-8">
              <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <Plus className="w-6 h-6 text-emerald-600" />
                  Link New Bank
                </h3>
              </div>
              <form onSubmit={addBank} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Bank Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      placeholder="e.g., HDFC Bank"
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Holder Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="Full name as per bank"
                      value={form.account_holder_name}
                      onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Account Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      placeholder="Enter account number"
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Account Type</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={form.account_type}
                      onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="savings">Savings Account</option>
                      <option value="current">Current Account</option>
                      <option value="nri_nro">NRI NRO Account</option>
                      <option value="nri_nre">NRI NRE Account</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">IFSC</label>
                    <input
                      required
                      placeholder="e.g., HDFC0001"
                      value={form.ifsc_code}
                      onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Branch</label>
                    <input
                      placeholder="Branch name"
                      value={form.branch_name}
                      onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Bank Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="Street, Area"
                      value={form.bank_address}
                      onChange={(e) => setForm({ ...form, bank_address: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">City</label>
                    <input
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Pincode</label>
                    <input
                      placeholder="600001"
                      maxLength="6"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">State</label>
                  <input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3 mt-4 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {isSubmitting ? "Securing..." : "Secure Account Link"}
                </button>
              </form>
            </div>
          </div>

          {/* Linked Banks List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Financial Anchors</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{banks.length} Archived</p>
            </div>

            {banks.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 p-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Layers className="w-12 h-12 text-slate-200" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-2">No Accounts Linked</h4>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-10"> Link your primary bank account to enable seamless deposits and lightning-fast redemptions.</p>
                <div className="inline-flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.2em] text-xs">
                  Awaiting First Link <ArrowRight className="w-4 h-4 animate-bounce-x" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                {banks.map((bank) => (
                  <div
                    key={bank.bank_id}
                    className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-300 group hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 ${bank.is_primary ? "border-emerald-100 ring-4 ring-emerald-500/5 bg-emerald-50/10" : "border-slate-100"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                        <Building2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {bank.is_primary && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm shadow-emerald-200/50">
                            <CheckCircle2 className="w-3 h-3" />
                            Primary
                          </div>
                        )}
                        {bank.verified ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-teal-200 shadow-sm shadow-teal-200/50">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm shadow-amber-200/50">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-2xl font-black text-slate-800 mb-1 truncate">{bank.bank_name || "Merchant Bank"}</h4>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-6">
                        <User className="w-4 h-4" />
                        {bank.account_holder_name || "Unknown Holder"}
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Account Index ({bank.account_type || "Savings"})</p>
                            <p className="text-slate-800 font-bold tracking-widest">•••• {bank.account_number.slice(-4)}</p>
                          </div>
                          <Lock className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">IFSC Route</p>
                            <p className="text-slate-800 font-black text-xs uppercase">{bank.ifsc_code || "N/A"}</p>
                          </div>
                          <div className="px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Geo Code</p>
                            <p className="text-slate-800 font-black text-[10px] uppercase truncate">{bank.branch_name || "Global"}</p>
                          </div>
                        </div>
                        {(bank.bank_address || bank.city) && (
                          <div className="px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Institution Address</p>
                            <p className="text-slate-600 font-bold text-[10px] uppercase truncate">
                              {[bank.bank_address, bank.city, bank.state, bank.pincode].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}

                        {/* Mandate Status Section */}
                        <div className={`p-4 rounded-2xl border ${bank.mandate_status === 'active'
                            ? 'bg-emerald-50/50 border-emerald-100'
                            : bank.mandate_status === 'inactive'
                              ? 'bg-amber-50/50 border-amber-100'
                              : 'bg-slate-50/50 border-slate-100'
                          }`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mandate Status</p>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-white border">
                              {bank.mandate_status === 'active' ? (
                                <><Activity className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-700">Live</span></>
                              ) : bank.mandate_status === 'inactive' ? (
                                <><Clock className="w-3 h-3 text-amber-500" /> <span className="text-amber-700">Pending</span></>
                              ) : (
                                <><History className="w-3 h-3 text-slate-400" /> <span className="text-slate-600">None</span></>
                              )}
                            </div>
                          </div>
                          {bank.mandate_umrn ? (
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-slate-500">UMRN: <span className="text-slate-700">{bank.mandate_umrn}</span></p>
                              <p className="text-[10px] font-bold text-slate-500">Limit: <span className="text-slate-700">₹{bank.mandate_limit.toLocaleString()}</span></p>
                            </div>
                          ) : (
                            <p className="text-[10px] font-medium text-slate-400 italic">No mandate registered for systematic plans.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
                      {bank.mandate_status === 'active' ? (
                        <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready for SIP
                        </div>
                      ) : bank.mandate_status === 'inactive' && bank.mandate_umrn ? (
                        <button
                          onClick={() => activateMandate(bank.bank_id)}
                          disabled={mandateLoading[bank.bank_id]}
                          className="flex-1 py-2.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {mandateLoading[bank.bank_id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Activate Mandate
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowMandateModal(bank.bank_id)}
                          disabled={mandateLoading[bank.bank_id]}
                          className="flex-1 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95"
                        >
                          {mandateLoading[bank.bank_id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                          Register Mandate
                        </button>
                      )}

                      {!bank.is_primary && (
                        <button
                          onClick={() => setPrimary(bank.bank_id)}
                          className="px-4 py-2.5 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-50 transition-all border border-emerald-100 active:scale-95"
                        >
                          Primary
                        </button>
                      )}

                      <button
                        onClick={() => removeBank(bank.bank_id)}
                        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                        title="Remove Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandate Registration Modal */}
      {showMandateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <button onClick={() => setShowMandateModal(null)} className="text-white/60 hover:text-white transition-colors">
                  <Plus className="w-8 h-8 rotate-45" />
                </button>
              </div>
              <h3 className="text-2xl font-black tracking-tight">E-Mandate Registration</h3>
              <p className="text-emerald-100/80 font-medium text-sm">Enable automated investments via UPI or Net Banking.</p>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Payment Channel</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMandateForm({ ...mandateForm, mandate_type: 'net_banking' })}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${mandateForm.mandate_type === 'net_banking' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    <Globe className={`w-6 h-6 ${mandateForm.mandate_type === 'net_banking' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-black uppercase ${mandateForm.mandate_type === 'net_banking' ? 'text-emerald-700' : 'text-slate-500'}`}>Net Banking</span>
                  </button>
                  <button
                    onClick={() => setMandateForm({ ...mandateForm, mandate_type: 'upi' })}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${mandateForm.mandate_type === 'upi' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    <Zap className={`w-6 h-6 ${mandateForm.mandate_type === 'upi' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-black uppercase ${mandateForm.mandate_type === 'upi' ? 'text-emerald-700' : 'text-slate-500'}`}>UPI Autopay</span>
                  </button>
                </div>
              </div>

              {mandateForm.mandate_type === 'upi' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">VPA / UPI ID</label>
                  <input
                    placeholder="user@bank"
                    value={mandateForm.upi_id}
                    onChange={(e) => setMandateForm({ ...mandateForm, upi_id: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Maximum Daily Limit (₹)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    value={mandateForm.mandate_amount_limit}
                    onChange={(e) => setMandateForm({ ...mandateForm, mandate_amount_limit: parseInt(e.target.value) })}
                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-500 font-medium italic">Max recommended: ₹1,00,000 for standard accounts.</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => registerMandate(showMandateModal)}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95"
                >
                  <Lock className="w-5 h-5" />
                  Initiate Secure Registration
                </button>
                <p className="mt-4 text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">NPCI Secured Gateway</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Infrastructure Banner */}
      <div className="max-w-6xl mx-auto px-6 mt-12 mb-20">
        <div className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-40 -mt-40 blur-[80px]"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white mb-2 tracking-tight">Enterprise-Grade Security</h4>
              <p className="text-slate-400 font-medium leading-relaxed max-w-md">Your banking coordinates are stored in ultra-secure, encrypted environments with continuous integrity monitoring.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex flex-col items-end">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-white font-bold">Operational</p>
            </div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}