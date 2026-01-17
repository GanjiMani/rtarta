import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Wallet, CheckCircle, ArrowRight, Info, AlertCircle, Landmark, ArrowLeft } from "lucide-react";

export default function Purchase() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    scheme_id: "",
    plan: "Growth",
    amount: "",
    bank_account_id: "",
    bank_account_last4: "",
    payment_mode: "net_banking",
  });

  const [selectedScheme, setSelectedScheme] = useState(null);
  const [calculatedUnits, setCalculatedUnits] = useState(0);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchSchemes();
      fetchBankAccounts();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.scheme_id && form.amount) {
      const scheme = schemes.find((s) => s.scheme_id === form.scheme_id);
      if (scheme && scheme.current_nav) {
        const units = parseFloat(form.amount) / parseFloat(scheme.current_nav);
        setCalculatedUnits(units || 0);
        setSelectedScheme(scheme);
      }
    } else {
      setCalculatedUnits(0);
      setSelectedScheme(null);
    }
  }, [form.scheme_id, form.amount, schemes]);

  const fetchSchemes = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/schemes");
      if (!response.ok) throw new Error("Failed to fetch schemes");
      const data = await response.json();
      setSchemes(data.data || data || []);
    } catch (err) {
      setError("Failed to load schemes");
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed to fetch bank accounts");
      const data = await response.json();
      const profile = data.data || {};
      setBankAccounts(profile.bank_accounts || []);
    } catch (err) {
      setError("Failed to load bank accounts");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.scheme_id) return setError("Please select a scheme");
    if (!form.plan) return setError("Please select a plan");
    if (!form.amount || parseFloat(form.amount) < 100) return setError("Minimum purchase amount is ₹100");
    if (!form.bank_account_id) return setError("Please select a bank account");
    if (!form.payment_mode) return setError("Please select a payment mode");

    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setShowReview(false);
    setError("");
    setSuccessMsg("");

    try {
      const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));
      const bankAccountLast4 = selectedBank?.account_number?.slice(-4) || "";

      const purchasePayload = {
        scheme_id: form.scheme_id,
        plan: form.plan,
        amount: parseFloat(form.amount),
        bank_account_last4: bankAccountLast4,
        payment_mode: form.payment_mode,
      };

      const response = await fetchWithAuth("/api/investor/transactions/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchasePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Purchase failed");
      }

      const result = await response.json();
      setSuccessMsg(`Purchase successful! ID: ${result.data?.transaction?.transaction_id || "N/A"}`);

      setTimeout(() => {
        setForm({
          scheme_id: "",
          plan: "Growth",
          amount: "",
          bank_account_id: "",
          bank_account_last4: "",
          payment_mode: "net_banking",
        });
        setSuccessMsg("");
        navigate("/transactions");
      }, 3000);
    } catch (err) {
      setError(err.message || "Purchase failed.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Purchase</h1>
          <p className="text-gray-500 text-sm">Invest in mutual funds.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 flex items-center gap-2 text-sm">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div className="max-w-3xl mx-auto border border-gray-100 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Scheme</label>
              <select
                value={form.scheme_id}
                onChange={(e) => {
                  const scheme = schemes.find((s) => s.scheme_id === e.target.value);
                  setForm({ ...form, scheme_id: e.target.value });
                  setSelectedScheme(scheme);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                required
              >
                <option value="">-- Select Scheme --</option>
                {schemes.map((scheme) => (
                  <option key={scheme.scheme_id} value={scheme.scheme_id}>{scheme.scheme_name}</option>
                ))}
              </select>
              {selectedScheme && (
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>NAV: ₹{Number(selectedScheme.current_nav).toFixed(4)}</span>
                  <span>Min: ₹{Number(selectedScheme.minimum_investment || 100).toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="Growth">Growth</option>
                <option value="IDCW Payout">IDCW Payout</option>
                <option value="IDCW Reinvestment">IDCW Reinvestment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min="100"
                step="0.01"
                placeholder="Min 100"
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                required
              />
              {calculatedUnits > 0 && <p className="text-xs text-green-600 mt-1">≈ {calculatedUnits.toFixed(3)} Units</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
              <div className="relative">
                <select
                  value={form.bank_account_id}
                  onChange={(e) => {
                    const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(e.target.value));
                    setForm({
                      ...form,
                      bank_account_id: e.target.value,
                      bank_account_last4: selectedBank?.account_number?.slice(-4) || "",
                    });
                  }}
                  className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.bank_name} - {account.account_number?.slice(-4)}</option>
                  ))}
                </select>
                <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                required
              >
                <option value="net_banking">Net Banking</option>
                <option value="upi">UPI</option>
                <option value="debit_mandate">Debit Mandate</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Processing..." : <>Review <ArrowRight size={14} /></>}
            </button>
          </div>
        </form>
      </div>

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Confirm Purchase</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Scheme</span>
                <span className="font-medium text-right max-w-[200px] truncate">{selectedScheme?.scheme_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-blue-600">₹{Number(form.amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium">{selectedBank?.bank_name}</span>
              </div>
            </div>
            <div className="p-4 flex gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="flex-1 py-2 border border-gray-200 rounded text-gray-600 text-sm hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                {loading ? "Confirming..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
