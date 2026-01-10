import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Shuffle, CheckCircle, X, ArrowRight, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function SwitchSetup() {
  const { fetchWithAuth, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [folios, setFolios] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    source_folio_number: "",
    target_scheme_id: "",
    switch_type: "amount",
    amount: "",
    units: "",
    all_units: false,
  });

  const [selectedSourceFolio, setSelectedSourceFolio] = useState(null);
  const [selectedTargetScheme, setSelectedTargetScheme] = useState(null);
  const [estimatedUnits, setEstimatedUnits] = useState(0);
  const [estimatedAmount, setEstimatedAmount] = useState(0);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchFolios();
      fetchSchemes();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.source_folio_number) {
      const folio = folios.find((f) => f.folio_number === form.source_folio_number);
      setSelectedSourceFolio(folio);
    } else {
      setSelectedSourceFolio(null);
    }
    if (form.target_scheme_id) {
      const scheme = schemes.find((s) => s.scheme_id === form.target_scheme_id);
      setSelectedTargetScheme(scheme);
    } else {
      setSelectedTargetScheme(null);
    }
  }, [form.source_folio_number, form.target_scheme_id, folios, schemes]);

  useEffect(() => {
    if (
      selectedSourceFolio &&
      selectedTargetScheme &&
      form.switch_type === "amount" &&
      form.amount
    ) {
      const sourceNav = selectedSourceFolio.current_nav || 0;
      const targetNav = selectedTargetScheme.current_nav || 0;
      const sourceUnits = parseFloat(form.amount) / parseFloat(sourceNav);
      const targetUnits = (sourceUnits * parseFloat(sourceNav)) / parseFloat(targetNav);
      setEstimatedUnits(Math.min(targetUnits, parseFloat(selectedSourceFolio.total_units || 0)));
    } else if (
      selectedSourceFolio &&
      selectedTargetScheme &&
      form.switch_type === "units" &&
      form.units
    ) {
      const sourceNav = selectedSourceFolio.current_nav || 0;
      const targetNav = selectedTargetScheme.current_nav || 0;
      const sourceAmount = parseFloat(form.units) * parseFloat(sourceNav);
      const targetUnits = sourceAmount / parseFloat(targetNav);
      setEstimatedAmount(sourceAmount);
      setEstimatedUnits(targetUnits);
    } else if (selectedSourceFolio && selectedTargetScheme && form.switch_type === "all") {
      setEstimatedUnits(
        (parseFloat(selectedSourceFolio.total_units || 0) *
          parseFloat(selectedSourceFolio.current_nav || 0)) /
          parseFloat(selectedTargetScheme.current_nav || 0)
      );
      setEstimatedAmount(parseFloat(selectedSourceFolio.total_value || 0));
    } else {
      setEstimatedAmount(0);
      setEstimatedUnits(0);
    }
  }, [form, selectedSourceFolio, selectedTargetScheme]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.source_folio_number) {
      setError("Please select a source folio");
      return;
    }
    if (!form.target_scheme_id) {
      setError("Please select a target scheme");
      return;
    }
    if (selectedSourceFolio && selectedSourceFolio.scheme_id === form.target_scheme_id) {
      setError("Source and target schemes must be different");
      return;
    }
    if (form.switch_type === "amount" && (!form.amount || parseFloat(form.amount) <= 0)) {
      setError("Please enter a valid switch amount");
      return;
    }
    if (form.switch_type === "units" && (!form.units || parseFloat(form.units) <= 0)) {
      setError("Please enter valid units to switch");
      return;
    }
    if (
      selectedSourceFolio &&
      form.switch_type === "amount" &&
      parseFloat(form.amount) > parseFloat(selectedSourceFolio.total_value || 0)
    ) {
      setError("Switch amount cannot exceed source folio value");
      return;
    }
    if (
      selectedSourceFolio &&
      form.switch_type === "units" &&
      parseFloat(form.units) > parseFloat(selectedSourceFolio.total_units || 0)
    ) {
      setError("Switch units cannot exceed available units");
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
        source_folio_number: form.source_folio_number,
        target_scheme_id: form.target_scheme_id,
      };

      if (form.switch_type === "amount") {
        payload.amount = parseFloat(form.amount);
      } else if (form.switch_type === "units") {
        payload.units = parseFloat(form.units);
      } else if (form.switch_type === "all") {
        payload.all_units = true;
      }

      const response = await fetchWithAuth("/api/investor/transactions/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Switch failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `Switch successful! Redemption Transaction: ${result.data?.redemption_txn_id || "N/A"}, Purchase Transaction: ${result.data?.purchase_txn_id || "N/A"}`
      );

      setTimeout(() => {
        setForm({
          source_folio_number: "",
          target_scheme_id: "",
          switch_type: "amount",
          amount: "",
          units: "",
          all_units: false,
        });
        setSuccessMsg("");
        fetchFolios();
        navigate("/transactions");
      }, 3000);
    } catch (err) {
      setError(err.message || "Switch failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter out target schemes that are same as source
  const availableTargetSchemes = schemes.filter(
    (scheme) => !selectedSourceFolio || scheme.scheme_id !== selectedSourceFolio.scheme_id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shuffle className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Switch Funds</h1>
          </div>
          <p className="text-indigo-100 text-lg">
            Switch your investments from one scheme to another
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

        {/* Switch Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Folio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Folio <span className="text-red-500">*</span>
              </label>
              <select
                value={form.source_folio_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    source_folio_number: e.target.value,
                    target_scheme_id: "",
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Source Folio --</option>
                {folios.map((folio) => (
                  <option key={folio.folio_number} value={folio.folio_number}>
                    {folio.scheme_name} ({folio.folio_number}) - Value: ₹
                    {Number(folio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {selectedSourceFolio && (
                <div className="mt-2 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800">
                  <p>Available Value: ₹{Number(selectedSourceFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                  <p>Available Units: {Number(selectedSourceFolio.total_units || 0).toFixed(4)}</p>
                  <p>Current NAV: ₹{Number(selectedSourceFolio.current_nav || 0).toFixed(4)}</p>
                </div>
              )}
            </div>

            {/* Target Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Scheme <span className="text-red-500">*</span>
              </label>
              <select
                value={form.target_scheme_id}
                onChange={(e) => setForm({ ...form, target_scheme_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={!form.source_folio_number}
              >
                <option value="">-- Select Target Scheme --</option>
                {availableTargetSchemes.map((scheme) => (
                  <option key={scheme.scheme_id} value={scheme.scheme_id}>
                    {scheme.scheme_name} ({scheme.scheme_id}) - NAV: ₹
                    {Number(scheme.current_nav || 0).toFixed(4)}
                  </option>
                ))}
              </select>
              {selectedTargetScheme && (
                <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
                  <p>Target Scheme NAV: ₹{Number(selectedTargetScheme.current_nav || 0).toFixed(4)}</p>
                </div>
              )}
            </div>

            {/* Switch Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Switch Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "amount", label: "By Amount" },
                  { value: "units", label: "By Units" },
                  { value: "all", label: "Switch All" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                      form.switch_type === type.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="switch_type"
                      value={type.value}
                      checked={form.switch_type === type.value}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          switch_type: e.target.value,
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
            {form.switch_type === "amount" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Switch Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  max={selectedSourceFolio ? selectedSourceFolio.total_value : undefined}
                  placeholder="Enter switch amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                {selectedSourceFolio && selectedTargetScheme && form.amount && (
                  <div className="mt-2 text-sm text-gray-600">
                    Estimated Target Units: {estimatedUnits.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {/* Units Input */}
            {form.switch_type === "units" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units to Switch <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.units}
                  onChange={(e) => setForm({ ...form, units: e.target.value })}
                  min="0"
                  step="0.0001"
                  max={selectedSourceFolio ? selectedSourceFolio.total_units : undefined}
                  placeholder="Enter units to switch"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                {selectedSourceFolio && selectedTargetScheme && form.units && (
                  <div className="mt-2 text-sm text-gray-600">
                    Estimated Switch Amount: ₹{estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} | Estimated Target Units: {estimatedUnits.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {/* All Units Info */}
            {form.switch_type === "all" && selectedSourceFolio && selectedTargetScheme && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-2">Full Switch Details:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-indigo-700">Source Units</p>
                    <p className="font-semibold text-indigo-900">
                      {Number(selectedSourceFolio.total_units || 0).toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-indigo-700">Source Amount</p>
                    <p className="font-semibold text-indigo-900">
                      ₹{Number(selectedSourceFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-indigo-700">Estimated Target Units</p>
                    <p className="font-semibold text-indigo-900">{estimatedUnits.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            )}

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
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Review Switch <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Review Modal */}
        {showReview && selectedSourceFolio && selectedTargetScheme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
                Review Switch
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Source Scheme</span>
                  <span className="font-semibold">{selectedSourceFolio.scheme_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Source Folio</span>
                  <span className="font-semibold">{form.source_folio_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Target Scheme</span>
                  <span className="font-semibold">{selectedTargetScheme.scheme_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Switch Type</span>
                  <span className="font-semibold capitalize">
                    {form.switch_type === "all"
                      ? "Switch All"
                      : form.switch_type === "amount"
                      ? "By Amount"
                      : "By Units"}
                  </span>
                </div>
                {form.switch_type === "amount" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Switch Amount</span>
                      <span className="font-semibold">₹{Number(form.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Target Units</span>
                      <span className="font-semibold">{estimatedUnits.toFixed(4)}</span>
                    </div>
                  </>
                )}
                {form.switch_type === "units" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Units to Switch</span>
                      <span className="font-semibold">{Number(form.units).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Switch Amount</span>
                      <span className="font-semibold">₹{estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Target Units</span>
                      <span className="font-semibold">{estimatedUnits.toFixed(4)}</span>
                    </div>
                  </>
                )}
                {form.switch_type === "all" && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Source Units</span>
                      <span className="font-semibold">{Number(selectedSourceFolio.total_units || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Switch Amount</span>
                      <span className="font-semibold">₹{Number(selectedSourceFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Estimated Target Units</span>
                      <span className="font-semibold">{estimatedUnits.toFixed(4)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Source NAV</span>
                  <span className="font-semibold">₹{Number(selectedSourceFolio.current_nav || 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Target NAV</span>
                  <span className="font-semibold">₹{Number(selectedTargetScheme.current_nav || 0).toFixed(4)}</span>
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
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    "Confirm Switch"
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
