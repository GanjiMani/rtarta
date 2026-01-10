import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Shuffle, CheckCircle, X, ArrowRight, TrendingDown } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function SWPSetup() {
  const { fetchWithAuth, token } = useAuth();
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
        `SWP setup successful! Registration ID: ${result.data?.swp_registration?.registration_id || "N/A"}`
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
      }, 3000);
    } catch (err) {
      setError(err.message || "SWP setup failed. Please try again.");
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
            <Shuffle className="w-8 h-8" />
            <h1 className="text-3xl font-bold">SWP Setup</h1>
          </div>
          <p className="text-orange-100 text-lg">
            Set up a Systematic Withdrawal Plan for regular withdrawals
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

        {/* SWP Setup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Folio Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Folio <span className="text-red-500">*</span>
              </label>
              <select
                value={form.folio_number}
                onChange={(e) => setForm({ ...form, folio_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Folio --</option>
                {folios.map((folio) => (
                  <option key={folio.folio_number} value={folio.folio_number}>
                    {folio.scheme_name} ({folio.folio_number}) - Value: ₹
                    {Number(folio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {selectedFolio && (
                <div className="mt-2 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
                  <p>Available Value: ₹{Number(selectedFolio.total_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                  <p>Available Units: {Number(selectedFolio.total_units || 0).toFixed(4)}</p>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min="500"
                step="0.01"
                max={selectedFolio ? selectedFolio.total_value : undefined}
                placeholder="Enter withdrawal amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bank Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account <span className="text-red-500">*</span>
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
                    Review SWP Setup <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Active SWPs */}
        {activeSWPs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Active SWPs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheme</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Installment</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSWPs.map((swp, index) => (
                    <tr key={swp.registration_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {swp.registration_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{swp.scheme_id || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ₹{Number(swp.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {swp.frequency || "Monthly"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {swp.next_installment_date
                          ? new Date(swp.next_installment_date).toLocaleDateString("en-IN")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {swp.total_installments_completed || 0} / {swp.number_of_installments || "∞"}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-orange-600" />
                Review SWP Setup
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
                  <span className="text-gray-600">Withdrawal Amount</span>
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
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">{form.end_date ? "End Date" : "Installments"}</span>
                    <span className="font-semibold">
                      {form.end_date
                        ? new Date(form.end_date).toLocaleDateString("en-IN")
                        : form.installments}
                    </span>
                  </div>
                )}
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
                    "Confirm SWP Setup"
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
