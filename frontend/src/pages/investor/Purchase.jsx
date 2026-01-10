import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Wallet, CheckCircle, X, ArrowRight, Info } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Purchase() {
  const { fetchWithAuth, token } = useAuth();
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

    // Validate scheme exists
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

      // Reset form
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
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Purchase Units</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Invest in mutual fund schemes with ease
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
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

        {/* Purchase Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scheme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Scheme <span className="text-red-500">*</span>
              </label>
              <select
                value={form.scheme_id}
                onChange={(e) => {
                  const scheme = schemes.find((s) => s.scheme_id === e.target.value);
                  setForm({ ...form, scheme_id: e.target.value });
                  setSelectedScheme(scheme);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Scheme --</option>
                {schemes.map((scheme) => (
                  <option key={scheme.scheme_id} value={scheme.scheme_id}>
                    {scheme.scheme_name} ({scheme.scheme_id}) - NAV: ₹
                    {Number(scheme.current_nav || 0).toFixed(4)}
                  </option>
                ))}
              </select>
              {selectedScheme && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">{selectedScheme.scheme_name}</p>
                    <p>Current NAV: ₹{Number(selectedScheme.current_nav || 0).toFixed(4)}</p>
                    <p>Minimum Investment: ₹{Number(selectedScheme.minimum_investment || 100).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {["Growth", "IDCW Payout", "IDCW Reinvestment"].map((plan) => (
                  <label
                    key={plan}
                    className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                      form.plan === plan
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan}
                      checked={form.plan === plan}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-700">{plan}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min="100"
                step="0.01"
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {form.amount && selectedScheme && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current NAV</p>
                      <p className="font-semibold text-gray-900">
                        ₹{Number(selectedScheme.current_nav || 0).toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimated Units</p>
                      <p className="font-semibold text-gray-900">
                        {calculatedUnits.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="net_banking">Net Banking</option>
                <option value="upi">UPI</option>
                <option value="debit_mandate">Debit Mandate</option>
              </select>
            </div>

            {/* Bank Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account <span className="text-red-500">*</span>
              </label>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Bank Account --</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - {account.account_number?.slice(-4) || "XXXX"} ({account.account_holder_name})
                    {account.is_primary && " [Primary]"}
                  </option>
                ))}
              </select>
              {selectedBank && (
                <div className="mt-2 text-sm text-gray-600">
                  IFSC: {selectedBank.ifsc_code} | Branch: {selectedBank.branch || "N/A"}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Review Purchase <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Review Modal */}
        {showReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                Review Purchase
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Scheme</span>
                  <span className="font-semibold">{selectedScheme?.scheme_name || form.scheme_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">{form.plan}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold">₹{Number(form.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">NAV per Unit</span>
                  <span className="font-semibold">₹{Number(selectedScheme?.current_nav || 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Estimated Units</span>
                  <span className="font-semibold">{calculatedUnits.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Bank Account</span>
                  <span className="font-semibold">
                    {selectedBank?.bank_name} - ****{selectedBank?.account_number?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Payment Mode</span>
                  <span className="font-semibold capitalize">{form.payment_mode.replace("_", " ")}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReview(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    "Confirm Purchase"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
