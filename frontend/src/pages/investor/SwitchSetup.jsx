import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Shuffle, CheckCircle, X, ArrowRight, TrendingUp, AlertCircle, Info } from "lucide-react";

export default function SwitchSetup() {
  const { fetchWithAuth } = useAuth();
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
        `Switch Successful! Trx ID: ${result.data?.redemption_txn_id || result.data?.purchase_txn_id || "Processing"}`
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

  const availableTargetSchemes = schemes.filter(
    (scheme) => !selectedSourceFolio || scheme.scheme_id !== selectedSourceFolio.scheme_id
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Shuffle className="w-8 h-8 text-purple-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Switch Funds</h1>
              <p className="text-purple-100 text-lg opacity-90">
                Move investments between schemes seamlessly
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Folio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Switch From (Source) <span className="text-red-500">*</span>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="">-- Select Source Folio --</option>
                    {folios.map((folio) => (
                      <option key={folio.folio_number} value={folio.folio_number}>
                        {folio.scheme_name} - {folio.folio_number}
                      </option>
                    ))}
                  </select>
                  {selectedSourceFolio && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Available</span>
                        <span className="font-semibold text-gray-900">₹{Number(selectedSourceFolio.total_value || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Units</span>
                        <span className="font-semibold text-gray-900">{Number(selectedSourceFolio.total_units || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Scheme */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Switch To (Target) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.target_scheme_id}
                    onChange={(e) => setForm({ ...form, target_scheme_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    required
                    disabled={!form.source_folio_number}
                  >
                    <option value="">-- Select Target Scheme --</option>
                    {availableTargetSchemes.map((scheme) => (
                      <option key={scheme.scheme_id} value={scheme.scheme_id}>
                        {scheme.scheme_name}
                      </option>
                    ))}
                  </select>
                  {selectedTargetScheme && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">NAV</span>
                        <span className="font-semibold text-gray-900">₹{Number(selectedTargetScheme.current_nav || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Switch Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Conversion Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "amount", label: "By Amount", desc: "Specific Value" },
                    { value: "units", label: "By Units", desc: "Specific Units" },
                    { value: "all", label: "Switch All", desc: "Full Transfer" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`relative cursor-pointer group`}
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
                      <div className={`p-4 rounded-xl border-2 text-center transition-all h-full flex flex-col justify-center ${form.switch_type === type.value
                          ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                          : "border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-600"
                        }`}>
                        <span className="font-semibold">{type.label}</span>
                        <span className="text-xs opacity-70 mt-1">{type.desc}</span>
                      </div>
                      {form.switch_type === type.value && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-purple-500 text-white p-1 rounded-full shadow-md">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                {form.switch_type === "amount" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount to Switch <span className="text-red-500">*</span>
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
                        max={selectedSourceFolio ? selectedSourceFolio.total_value : undefined}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-medium"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                )}

                {form.switch_type === "units" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Units to Switch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.units}
                      onChange={(e) => setForm({ ...form, units: e.target.value })}
                      min="0"
                      step="0.0001"
                      max={selectedSourceFolio ? selectedSourceFolio.total_units : undefined}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-medium"
                      placeholder="0.0000"
                      required
                    />
                  </div>
                )}

                {form.switch_type === "all" && selectedSourceFolio && (
                  <div className="text-center py-2">
                    <p className="text-gray-600 mb-1">Switching entire holding of</p>
                    <p className="text-2xl font-bold text-purple-600 mb-2">
                      {Number(selectedSourceFolio.total_units || 0).toFixed(4)} Units
                    </p>
                    <p className="text-sm text-gray-500">
                      Approx. Value: ₹{Number(selectedSourceFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                {selectedSourceFolio && selectedTargetScheme && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm">
                    <span className="text-gray-600">Est. Target Units:</span>
                    <span className="font-bold text-gray-900 text-lg">{estimatedUnits.toFixed(4)}</span>
                  </div>
                )}
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
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
        {showReview && selectedSourceFolio && selectedTargetScheme && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Review Switch</h3>
                <p className="text-purple-100 text-sm">Verify transfer details</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">From</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedSourceFolio.scheme_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">To</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedTargetScheme.scheme_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Est. Switch Value</span>
                  <span className="font-bold text-lg text-purple-600">
                    ₹{form.switch_type === "amount"
                      ? Number(form.amount).toLocaleString("en-IN")
                      : estimatedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Est. Target Units</span>
                  <span className="font-bold text-gray-900">{estimatedUnits.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="text-xs text-gray-500">
                    Source NAV: ₹{Number(selectedSourceFolio.current_nav).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Target NAV: ₹{Number(selectedTargetScheme.current_nav).toFixed(2)}
                  </div>
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
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? "Processing..." : "Confirm Switch"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
