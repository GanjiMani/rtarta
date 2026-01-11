import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Wallet, CheckCircle, X, ArrowRight, Info, AlertCircle, CreditCard, Landmark } from "lucide-react";

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
      setError("Failed to load schemes: " + err.message);
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
      setError("Failed to load bank accounts: " + err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.scheme_id) {
      setError("Please select a scheme");
      return;
    }
    if (!form.plan) {
      setError("Please select a plan");
      return;
    }
    if (!form.amount || parseFloat(form.amount) < 100) {
      setError("Minimum purchase amount is ₹100");
      return;
    }
    if (!form.bank_account_id) {
      setError("Please select a bank account");
      return;
    }
    if (!form.payment_mode) {
      setError("Please select a payment mode");
      return;
    }

    const schemeExists = schemes.find((s) => s.scheme_id === form.scheme_id);
    if (!schemeExists) {
      setError("Selected scheme not found");
      return;
    }

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchasePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Purchase failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `Purchase successful! Transaction ID: ${result.data?.transaction?.transaction_id || "N/A"}`
      );

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
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Wallet className="w-8 h-8 text-blue-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">New Purchase</h1>
              <p className="text-blue-100 text-lg opacity-90">
                Invest in top-performing mutual funds
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 max-w-4xl mx-auto -mt-8 relative z-10">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 font-medium">{successMsg}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Scheme Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Scheme <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.scheme_id}
                    onChange={(e) => {
                      const scheme = schemes.find((s) => s.scheme_id === e.target.value);
                      setForm({ ...form, scheme_id: e.target.value });
                      setSelectedScheme(scheme);
                    }}
                    className="w-full pl-4 pr-10 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="">-- Choose a scheme to invest in --</option>
                    {schemes.map((scheme) => (
                      <option key={scheme.scheme_id} value={scheme.scheme_id}>
                        {scheme.scheme_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {selectedScheme && (
                  <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="flex justify-between items-center w-full max-w-md">
                        <span className="text-gray-500">Current NAV</span>
                        <span className="font-bold text-gray-900">₹{Number(selectedScheme.current_nav || 0).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between items-center w-full max-w-md">
                        <span className="text-gray-500">Min. Investment</span>
                        <span className="font-bold text-gray-900">₹{Number(selectedScheme.minimum_investment || 100).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Investment Plan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["Growth", "IDCW Payout", "IDCW Reinvestment"].map((plan) => (
                    <label
                      key={plan}
                      className={`relative cursor-pointer group`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan}
                        checked={form.plan === plan}
                        onChange={(e) => setForm({ ...form, plan: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 text-center transition-all ${form.plan === plan
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600"
                        }`}>
                        <span className="font-medium">{plan}</span>
                      </div>
                      {form.plan === plan && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-500 text-white p-1 rounded-full shadow-md">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount to Invest <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-semibold text-lg">₹</span>
                  </div>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    min="100"
                    step="0.01"
                    placeholder="Enter amount (min ₹100)"
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                    required
                  />
                  {calculatedUnits > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        ≈ {calculatedUnits.toFixed(3)} Units
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Account */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Account <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.bank_account_id}
                      onChange={(e) => {
                        const selectedBank = bankAccounts.find(
                          (ba) => ba.id === parseInt(e.target.value)
                        );
                        setForm({
                          ...form,
                          bank_account_id: e.target.value,
                          bank_account_last4: selectedBank?.account_number?.slice(-4) || "",
                        });
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      required
                    >
                      <option value="">-- Select Bank --</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number?.slice(-4)}
                        </option>
                      ))}
                    </select>
                    <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.payment_mode}
                      onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                      className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      required
                    >
                      <option value="net_banking">Net Banking</option>
                      <option value="upi">UPI ID</option>
                      <option value="debit_mandate">Debit Mandate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Review <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Review Modal */}
        {showReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Review Order</h3>
                <p className="text-blue-100 text-sm">Please verify your transaction details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Scheme</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedScheme?.scheme_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Plan Type</span>
                  <span className="font-semibold text-gray-900">{form.plan}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Amount</span>
                  <span className="font-bold text-xl text-blue-600">₹{Number(form.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">NAV / Est. Units</span>
                  <span className="font-medium text-gray-900">₹{Number(selectedScheme?.current_nav || 0).toFixed(2)} / {calculatedUnits.toFixed(3)} u</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Debit From</span>
                  <span className="font-medium text-gray-900 text-right">
                    {selectedBank?.bank_name} <br />
                    <span className="text-xs text-gray-500">****{selectedBank?.account_number?.slice(-4)}</span>
                  </span>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex gap-4">
                <button
                  onClick={() => setShowReview(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? "Confirming..." : "Confirm & Pay"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
