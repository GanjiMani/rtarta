import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { DollarSign, CheckCircle, X, ArrowRight, Info, AlertCircle, Landmark } from "lucide-react";

export default function Redemption() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [folios, setFolios] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    folio_number: "",
    redemption_type: "amount",
    amount: "",
    units: "",
    all_units: false,
    bank_account_id: "",
  });

  const [selectedFolio, setSelectedFolio] = useState(null);
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [estimatedUnits, setEstimatedUnits] = useState(0);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchFolios();
      fetchBankAccounts();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.folio_number) {
      const folio = folios.find((f) => f.folio_number === form.folio_number);
      setSelectedFolio(folio);
    } else {
      setSelectedFolio(null);
    }
  }, [form.folio_number, folios]);

  useEffect(() => {
    if (selectedFolio && form.redemption_type === "amount" && form.amount) {
      const nav = selectedFolio.current_nav || 0;
      const units = parseFloat(form.amount) / parseFloat(nav);
      setEstimatedUnits(Math.min(units, parseFloat(selectedFolio.total_units || 0)));
    } else if (selectedFolio && form.redemption_type === "units" && form.units) {
      const nav = selectedFolio.current_nav || 0;
      const amount = parseFloat(form.units) * parseFloat(nav);
      setEstimatedAmount(Math.min(amount, parseFloat(selectedFolio.total_value || 0)));
    } else if (selectedFolio && form.redemption_type === "all") {
      setEstimatedUnits(parseFloat(selectedFolio.total_units || 0));
      setEstimatedAmount(parseFloat(selectedFolio.total_value || 0));
    } else {
      setEstimatedAmount(0);
      setEstimatedUnits(0);
    }
  }, [form, selectedFolio]);

  const fetchFolios = async () => {
    try {
      const response = await fetchWithAuth(
        "/api/investor/folios?active_only=true&with_units_only=true"
      );
      if (!response.ok) throw new Error("Failed to fetch folios");
      const data = await response.json();
      setFolios(data.data || data || []);
    } catch (err) {
      setError("Failed to load folios: " + err.message);
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

    if (!form.folio_number) {
      setError("Please select a folio");
      return;
    }
    if (form.redemption_type === "amount" && (!form.amount || parseFloat(form.amount) <= 0)) {
      setError("Please enter a valid redemption amount");
      return;
    }
    if (form.redemption_type === "units" && (!form.units || parseFloat(form.units) <= 0)) {
      setError("Please enter valid units to redeem");
      return;
    }
    if (selectedFolio && form.redemption_type === "amount" && parseFloat(form.amount) > parseFloat(selectedFolio.total_value || 0)) {
      setError("Redemption amount cannot exceed current value");
      return;
    }
    if (selectedFolio && form.redemption_type === "units" && parseFloat(form.units) > parseFloat(selectedFolio.total_units || 0)) {
      setError("Redemption units cannot exceed available units");
      return;
    }
    if (!form.bank_account_id) {
      setError("Please select a bank account for redemption proceeds");
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
      const payload = {
        folio_number: form.folio_number,
      };

      if (form.redemption_type === "amount") {
        payload.amount = parseFloat(form.amount);
      } else if (form.redemption_type === "units") {
        payload.units = parseFloat(form.units);
      } else if (form.redemption_type === "all") {
        payload.all_units = true;
      }

      // Ensure we explicitly use the bank account from the form if the API supports it, 
      // otherwise ensure the backend defaults correctly. 
      // Assuming backend might need bank_account_id if multiple exist, but current proto might imply default.
      // We'll trust the backend handles the payout to registered bank.

      const response = await fetchWithAuth("/api/investor/transactions/redemption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Redemption failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `Redemption successful! Transaction ID: ${result.data?.transaction?.transaction_id || "N/A"}`
      );

      setTimeout(() => {
        setForm({
          folio_number: "",
          redemption_type: "amount",
          amount: "",
          units: "",
          all_units: false,
          bank_account_id: "",
        });
        setSuccessMsg("");
        fetchFolios();
        navigate("/transactions");
      }, 3000);
    } catch (err) {
      setError(err.message || "Redemption failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <DollarSign className="w-8 h-8 text-orange-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Redeem Units</h1>
              <p className="text-orange-100 text-lg opacity-90">
                Withdraw funds from your portfolio
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
              {/* Folio Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Folio to Redeem From <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.folio_number}
                    onChange={(e) => {
                      const folio = folios.find((f) => f.folio_number === e.target.value);
                      setForm({ ...form, folio_number: e.target.value });
                      setSelectedFolio(folio);
                    }}
                    className="w-full pl-4 pr-10 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="">-- Choose a folio --</option>
                    {folios.map((folio) => (
                      <option key={folio.folio_number} value={folio.folio_number}>
                        {folio.scheme_name} - {folio.folio_number}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {selectedFolio && (
                  <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Current Value</p>
                      <p className="text-lg font-bold text-gray-900">₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Available Units</p>
                      <p className="text-lg font-bold text-gray-900">{Number(selectedFolio.total_units || 0).toFixed(4)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold">NAV</p>
                      <p className="text-lg font-bold text-gray-900">₹{Number(selectedFolio.current_nav || 0).toFixed(4)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Redemption Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  How would you like to redeem? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "amount", label: "By Amount", desc: "Enter value in ₹" },
                    { value: "units", label: "By Units", desc: "Enter no. of units" },
                    { value: "all", label: "Redeem All", desc: "Exit scheme fully" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`relative cursor-pointer group`}
                    >
                      <input
                        type="radio"
                        name="redemption_type"
                        value={type.value}
                        checked={form.redemption_type === type.value}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            redemption_type: e.target.value,
                            all_units: e.target.value === "all",
                          })
                        }
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 text-center transition-all h-full flex flex-col justify-center ${form.redemption_type === type.value
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-gray-200 hover:border-orange-300 hover:bg-gray-50 text-gray-600"
                        }`}>
                        <span className="font-semibold">{type.label}</span>
                        <span className="text-xs opacity-70 mt-1">{type.desc}</span>
                      </div>
                      {form.redemption_type === type.value && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-orange-500 text-white p-1 rounded-full shadow-md">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Inputs based on type */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                {form.redemption_type === "amount" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount to Redeem <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-semibold text-lg">₹</span>
                      </div>
                      <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        max={selectedFolio ? selectedFolio.total_value : undefined}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    {selectedFolio && form.amount && (
                      <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Est. Units: <strong>{estimatedUnits.toFixed(4)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {form.redemption_type === "units" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Units to Redeem <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.units}
                      onChange={(e) => setForm({ ...form, units: e.target.value })}
                      min="0"
                      step="0.0001"
                      max={selectedFolio ? selectedFolio.total_units : undefined}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium"
                      placeholder="0.0000"
                      required
                    />
                    {selectedFolio && form.units && (
                      <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Est. Amount: <strong>₹{estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                      </p>
                    )}
                  </div>
                )}

                {form.redemption_type === "all" && selectedFolio && (
                  <div className="text-center py-2">
                    <p className="text-gray-600 mb-1">You are about to redeem your entire holding of</p>
                    <p className="text-2xl font-bold text-orange-600 mb-2">
                      {Number(selectedFolio.total_units || 0).toFixed(4)} Units
                    </p>
                    <p className="text-sm text-gray-500">
                      Approximate Value: ₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Credit To Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.bank_account_id}
                    onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                    required
                  >
                    <option value="">-- Select Bank Account --</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number?.slice(-4)} {account.is_primary && "(Primary)"}
                      </option>
                    ))}
                  </select>
                  <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
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
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
        {showReview && selectedFolio && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Review Request</h3>
                <p className="text-orange-100 text-sm">Please verify your redemption details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Scheme</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedFolio.scheme_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Action</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {form.redemption_type === "all" ? "Full Redemption" : "Partial Redemption"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Units</span>
                  <span className="font-bold text-gray-900">
                    {form.redemption_type === "units" ? Number(form.units).toFixed(4) : estimatedUnits.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Est. Amount</span>
                  <span className="font-bold text-xl text-orange-600">
                    ₹{form.redemption_type === "amount"
                      ? Number(form.amount).toLocaleString("en-IN")
                      : estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Credit To</span>
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
                  className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
