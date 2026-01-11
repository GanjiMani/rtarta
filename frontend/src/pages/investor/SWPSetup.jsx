import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Shuffle, CheckCircle, X, ArrowRight, TrendingDown, AlertCircle, Landmark, Calendar } from "lucide-react";

export default function SWPSetup() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [folios, setFolios] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [activeSWPs, setActiveSWPs] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    folio_number: "",
    amount: "",
    frequency: "Monthly",
    start_date: "",
    end_date: "",
    installments: "",
    bank_account_id: "",
  });

  const [selectedFolio, setSelectedFolio] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchFolios();
      fetchBankAccounts();
      fetchActiveSWPs();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.folio_number) {
      const folio = folios.find((f) => f.folio_number === form.folio_number);
      setSelectedFolio(folio);
    }
  }, [form.folio_number, folios]);

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

  const fetchActiveSWPs = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/swp/active");
      if (!response.ok) throw new Error("Failed to fetch active SWPs");
      const data = await response.json();
      setActiveSWPs(data.data || data || []);
    } catch (err) {
      console.error("Error fetching active SWPs:", err);
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
    if (!form.amount || parseFloat(form.amount) < 500) {
      setError("Minimum SWP amount is ₹500");
      return;
    }
    if (selectedFolio && parseFloat(form.amount) > parseFloat(selectedFolio.total_value || 0)) {
      setError("SWP amount cannot exceed current folio value");
      return;
    }
    if (!form.start_date) {
      setError("Please select a start date");
      return;
    }
    if (!form.bank_account_id) {
      setError("Please select a bank account");
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
      const swpPayload = {
        folio_number: form.folio_number,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        installments: form.installments ? parseInt(form.installments) : null,
        bank_account_id: parseInt(form.bank_account_id),
      };

      const response = await fetchWithAuth("/api/investor/transactions/swp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(swpPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "SWP setup failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `SWP Registration Successful! ID: ${result.data?.swp_registration?.registration_id || "Processing"}`
      );

      setTimeout(() => {
        setForm({
          folio_number: "",
          amount: "",
          frequency: "Monthly",
          start_date: "",
          end_date: "",
          installments: "",
          bank_account_id: "",
        });
        setSuccessMsg("");
        fetchActiveSWPs();
        fetchFolios();
        // navigate("/transactions") // Optional: redirect or stay to see successful processing msg
      }, 3000);
    } catch (err) {
      setError(err.message || "SWP setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <TrendingDown className="w-8 h-8 text-orange-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SWP Registration</h1>
              <p className="text-orange-100 text-lg opacity-90">
                Systematic Withdrawal Plan for regular income
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
              {/* Folio Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Source Folio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.folio_number}
                    onChange={(e) => setForm({ ...form, folio_number: e.target.value })}
                    className="w-full pl-4 pr-10 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="">-- Choose a folio with holdings --</option>
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
                  <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Current Value</p>
                      <p className="text-lg font-bold text-gray-900">₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold text-right">Eligible for SWP</p>
                      <p className="text-sm font-medium text-green-600 text-right">Yes</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Withdrawal Amount <span className="text-red-500">*</span>
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
                      max={selectedFolio ? selectedFolio.total_value : undefined}
                      placeholder="Min ₹500"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium"
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
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
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
                  SWP Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>
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
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-red-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Active SWPs List */}
        {activeSWPs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">Your Active SWPs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Scheme</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Freq.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Next Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeSWPs.map((swp, index) => (
                    <tr key={swp.registration_id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{swp.scheme_id}</div>
                        <div className="text-xs text-gray-400 font-mono">#{swp.registration_id}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ₹{Number(swp.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {swp.frequency || "Monthly"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {swp.next_installment_date
                          ? new Date(swp.next_installment_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">
                          {swp.total_installments_completed || 0} / {swp.number_of_installments || "∞"}
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
        {showReview && selectedFolio && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 text-white text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Review SWP</h3>
                <p className="text-orange-100 text-sm">Verify withdrawal settings</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Source Scheme</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedFolio.scheme_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Withdrawal Amount</span>
                  <span className="font-bold text-xl text-orange-600">₹{Number(form.amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Frequency</span>
                  <span className="font-semibold text-gray-900">{form.frequency}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Start Date</span>
                  <span className="font-semibold text-gray-900">{form.start_date ? new Date(form.start_date).toLocaleDateString("en-IN") : "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Credit Account</span>
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
                  {loading ? "Processing..." : "Confirm SWP"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
