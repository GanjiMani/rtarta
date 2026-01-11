import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { RefreshCw, CheckCircle, X, ArrowRight, TrendingUp, AlertCircle, Calendar, Info } from "lucide-react";

export default function STPSetup() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [folios, setFolios] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [activeSTPs, setActiveSTPs] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    source_folio_number: "",
    target_scheme_id: "",
    amount: "",
    frequency: "Monthly",
    start_date: "",
    end_date: "",
    installments: "",
  });

  const [selectedSourceFolio, setSelectedSourceFolio] = useState(null);
  const [selectedTargetScheme, setSelectedTargetScheme] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchFolios();
      fetchSchemes();
      fetchActiveSTPs();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.source_folio_number) {
      const folio = folios.find((f) => f.folio_number === form.source_folio_number);
      setSelectedSourceFolio(folio);
    }
    if (form.target_scheme_id) {
      const scheme = schemes.find((s) => s.scheme_id === form.target_scheme_id);
      setSelectedTargetScheme(scheme);
    }
  }, [form.source_folio_number, form.target_scheme_id, folios, schemes]);

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

  const fetchActiveSTPs = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/stp/active");
      if (!response.ok) throw new Error("Failed to fetch active STPs");
      const data = await response.json();
      setActiveSTPs(data.data || data || []);
    } catch (err) {
      console.error("Error fetching active STPs:", err);
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
    if (form.source_folio_number && form.target_scheme_id) {
      const sourceFolio = folios.find((f) => f.folio_number === form.source_folio_number);
      if (sourceFolio && sourceFolio.scheme_id === form.target_scheme_id) {
        setError("Source and target schemes must be different");
        return;
      }
    }
    if (!form.amount || parseFloat(form.amount) < 500) {
      setError("Minimum STP amount is ₹500");
      return;
    }
    if (selectedSourceFolio && parseFloat(form.amount) > parseFloat(selectedSourceFolio.total_value || 0)) {
      setError("STP amount cannot exceed source folio value");
      return;
    }
    if (!form.start_date) {
      setError("Please select a start date");
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
      const stpPayload = {
        source_folio_number: form.source_folio_number,
        target_scheme_id: form.target_scheme_id,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        installments: form.installments ? parseInt(form.installments) : null,
      };

      const response = await fetchWithAuth("/api/investor/transactions/stp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stpPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "STP setup failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `STP Registration Successful! ID: ${result.data?.stp_registration?.registration_id || "Processing"}`
      );

      setTimeout(() => {
        setForm({
          source_folio_number: "",
          target_scheme_id: "",
          amount: "",
          frequency: "Monthly",
          start_date: "",
          end_date: "",
          installments: "",
        });
        setSuccessMsg("");
        fetchActiveSTPs();
        fetchFolios();
      }, 3000);
    } catch (err) {
      setError(err.message || "STP setup failed. Please try again.");
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
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <RefreshCw className="w-8 h-8 text-teal-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">STP Registration</h1>
              <p className="text-teal-100 text-lg opacity-90">
                Systematic Transfer Plan for automated fund transfers
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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Folio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transfer From (Source) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.source_folio_number}
                    onChange={(e) => setForm({ ...form, source_folio_number: e.target.value, target_scheme_id: "" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50 focus:bg-white transition-all appearance-none"
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
                    <div className="mt-3 p-3 bg-teal-50 rounded-xl border border-teal-100 text-sm">
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
                    Transfer To (Target) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.target_scheme_id}
                    onChange={(e) => setForm({ ...form, target_scheme_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50 focus:bg-white transition-all appearance-none"
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
                    <div className="mt-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">NAV</span>
                        <span className="font-semibold text-gray-900">₹{Number(selectedTargetScheme.current_nav || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transfer Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transfer Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-semibold text-lg">₹</span>
                    </div>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      min="500"
                      step="0.01"
                      max={selectedSourceFolio ? selectedSourceFolio.total_value : undefined}
                      placeholder="Min ₹500"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  STP Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Optional Section */}
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Duration Options (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value, installments: "" })}
                      min={form.start_date || new Date().toISOString().split("T")[0]}
                      disabled={!!form.installments}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">
                      No. of Installments
                    </label>
                    <input
                      type="number"
                      value={form.installments}
                      onChange={(e) => setForm({ ...form, installments: e.target.value, end_date: "" })}
                      min="1"
                      disabled={!!form.end_date}
                      placeholder="e.g. 12"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    />
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
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Active STPs List */}
        {activeSTPs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-900">Your Active STPs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">From → To</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Freq.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Next Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeSTPs.map((stp, index) => (
                    <tr key={stp.registration_id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{stp.source_scheme_id}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <ArrowRight className="w-3 h-3" />
                          {stp.target_scheme_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ₹{Number(stp.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {stp.frequency || "Monthly"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {stp.next_installment_date
                          ? new Date(stp.next_installment_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs font-bold">
                          {stp.total_installments_completed || 0} / {stp.number_of_installments || "∞"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReview && selectedSourceFolio && selectedTargetScheme && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-700 p-6 text-white text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Review STP</h3>
                <p className="text-teal-100 text-sm">Verify transfer plan details</p>
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
                  <span className="text-gray-500 text-sm">Transfer Amount</span>
                  <span className="font-bold text-xl text-teal-600">
                    ₹{Number(form.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Frequency</span>
                  <span className="font-semibold text-gray-900">{form.frequency}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Start Date</span>
                  <span className="font-semibold text-gray-900">{form.start_date ? new Date(form.start_date).toLocaleDateString("en-IN") : "-"}</span>
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
                  className="flex-1 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? "Processing..." : "Confirm STP"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
