import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { RefreshCw, CheckCircle, X, ArrowRight, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function STPSetup() {
  const { fetchWithAuth, token } = useAuth();
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
        `STP setup successful! Registration ID: ${result.data?.stp_registration?.registration_id || "N/A"}`
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

  // Filter out target schemes that are same as source
  const availableTargetSchemes = schemes.filter(
    (scheme) => !selectedSourceFolio || scheme.scheme_id !== selectedSourceFolio.scheme_id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-8 h-8" />
            <h1 className="text-3xl font-bold">STP Setup</h1>
          </div>
          <p className="text-purple-100 text-lg">
            Set up a Systematic Transfer Plan to transfer funds between schemes
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

        {/* STP Setup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Folio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Folio <span className="text-red-500">*</span>
              </label>
              <select
                value={form.source_folio_number}
                onChange={(e) => setForm({ ...form, source_folio_number: e.target.value, target_scheme_id: "" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
                  <p>Available Value: ₹{Number(selectedSourceFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                  <p>Available Units: {Number(selectedSourceFolio.total_units || 0).toFixed(4)}</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min="500"
                step="0.01"
                max={selectedSourceFolio ? selectedSourceFolio.total_value : undefined}
                placeholder="Enter transfer amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Weekly">Weekly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* End Date or Installments */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value, installments: "" })}
                  min={form.start_date || new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Installments (Optional)
                </label>
                <input
                  type="number"
                  value={form.installments}
                  onChange={(e) => setForm({ ...form, installments: e.target.value, end_date: "" })}
                  min="1"
                  placeholder="e.g., 12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
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
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Review STP Setup <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Active STPs */}
        {activeSTPs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Active STPs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Scheme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Scheme</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Installment</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSTPs.map((stp, index) => (
                    <tr key={stp.registration_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stp.registration_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stp.source_scheme_id || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stp.target_scheme_id || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ₹{Number(stp.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {stp.frequency || "Monthly"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stp.next_installment_date
                          ? new Date(stp.next_installment_date).toLocaleDateString("en-IN")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {stp.total_installments_completed || 0} / {stp.number_of_installments || "∞"}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                Review STP Setup
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
                  <span className="text-gray-600">Transfer Amount</span>
                  <span className="font-semibold">₹{Number(form.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Frequency</span>
                  <span className="font-semibold">{form.frequency}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-semibold">
                    {form.start_date ? new Date(form.start_date).toLocaleDateString("en-IN") : "N/A"}
                  </span>
                </div>
                {(form.end_date || form.installments) && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">{form.end_date ? "End Date" : "Installments"}</span>
                    <span className="font-semibold">
                      {form.end_date
                        ? new Date(form.end_date).toLocaleDateString("en-IN")
                        : form.installments}
                    </span>
                  </div>
                )}
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
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    "Confirm STP Setup"
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
