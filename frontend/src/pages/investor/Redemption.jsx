import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { DollarSign, CheckCircle, X, ArrowRight, Info } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Redemption() {
  const { fetchWithAuth, token } = useAuth();
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

      // Reset form
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
        fetchFolios(); // Refresh folios
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
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white shadow-lg">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Redeem Units</h1>
          </div>
          <p className="text-orange-100 text-lg">
            Withdraw your investment from mutual fund schemes
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

        {/* Redemption Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Folio Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Folio <span className="text-red-500">*</span>
              </label>
              <select
                value={form.folio_number}
                onChange={(e) => {
                  const folio = folios.find((f) => f.folio_number === e.target.value);
                  setForm({ ...form, folio_number: e.target.value });
                  setSelectedFolio(folio);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Folio --</option>
                {folios.map((folio) => (
                  <option key={folio.folio_number} value={folio.folio_number}>
                    {folio.scheme_name} ({folio.folio_number}) - Units: {Number(folio.total_units || 0).toFixed(4)} | Value: ₹
                    {Number(folio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {selectedFolio && (
                <div className="mt-2 p-3 bg-orange-50 rounded-lg flex items-start gap-2">
                  <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">{selectedFolio.scheme_name}</p>
                    <p>Available Units: {Number(selectedFolio.total_units || 0).toFixed(4)}</p>
                    <p>Current NAV: ₹{Number(selectedFolio.current_nav || 0).toFixed(4)}</p>
                    <p>Current Value: ₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Redemption Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Redemption Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "amount", label: "By Amount" },
                  { value: "units", label: "By Units" },
                  { value: "all", label: "Redeem All" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                      form.redemption_type === type.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
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
                    <span className="font-medium text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            {form.redemption_type === "amount" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redemption Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  max={selectedFolio ? selectedFolio.total_value : undefined}
                  placeholder="Enter redemption amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                {selectedFolio && form.amount && (
                  <div className="mt-2 text-sm text-gray-600">
                    Estimated Units: {estimatedUnits.toFixed(4)} | Max: ₹
                    {Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            )}

            {/* Units Input */}
            {form.redemption_type === "units" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units to Redeem <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.units}
                  onChange={(e) => setForm({ ...form, units: e.target.value })}
                  min="0"
                  step="0.0001"
                  max={selectedFolio ? selectedFolio.total_units : undefined}
                  placeholder="Enter units to redeem"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                {selectedFolio && form.units && (
                  <div className="mt-2 text-sm text-gray-600">
                    Estimated Amount: ₹{estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} | Max Units:{" "}
                    {Number(selectedFolio.total_units || 0).toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {/* All Units Info */}
            {form.redemption_type === "all" && selectedFolio && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-2">Full Redemption Details:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-orange-700">Units to Redeem</p>
                    <p className="font-semibold text-orange-900">
                      {Number(selectedFolio.total_units || 0).toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-700">Estimated Amount</p>
                    <p className="font-semibold text-orange-900">
                      ₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account for Proceeds <span className="text-red-500">*</span>
              </label>
              <select
                value={form.bank_account_id}
                onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Review Redemption <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Review Modal */}
        {showReview && selectedFolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-orange-600" />
                Review Redemption
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Scheme</span>
                  <span className="font-semibold">{selectedFolio.scheme_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Folio Number</span>
                  <span className="font-semibold">{form.folio_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Redemption Type</span>
                  <span className="font-semibold capitalize">
                    {form.redemption_type === "all"
                      ? "Redeem All"
                      : form.redemption_type === "amount"
                      ? "By Amount"
                      : "By Units"}
                  </span>
                </div>
                {form.redemption_type === "amount" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Redemption Amount</span>
                      <span className="font-semibold">₹{Number(form.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Units</span>
                      <span className="font-semibold">{estimatedUnits.toFixed(4)}</span>
                    </div>
                  </>
                )}
                {form.redemption_type === "units" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Units to Redeem</span>
                      <span className="font-semibold">{Number(form.units).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Amount</span>
                      <span className="font-semibold">₹{estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                {form.redemption_type === "all" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Units to Redeem</span>
                      <span className="font-semibold">{Number(selectedFolio.total_units || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Amount</span>
                      <span className="font-semibold">₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Current NAV</span>
                  <span className="font-semibold">₹{Number(selectedFolio.current_nav || 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Bank Account</span>
                  <span className="font-semibold">
                    {selectedBank?.bank_name} - ****{selectedBank?.account_number?.slice(-4)}
                  </span>
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
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    "Confirm Redemption"
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
