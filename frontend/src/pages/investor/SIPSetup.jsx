import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Repeat, CheckCircle, X, ArrowRight, Calendar, Wallet, AlertCircle, Landmark, Clock } from "lucide-react";

export default function SIPSetup() {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [activeSIPs, setActiveSIPs] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    scheme_id: "",
    amount: "",
    frequency: "Monthly",
    start_date: "",
    end_date: "",
    installments: "",
    bank_account_id: "",
  });

  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchSchemes();
      fetchBankAccounts();
      fetchActiveSIPs();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.scheme_id) {
      const scheme = schemes.find((s) => s.scheme_id === form.scheme_id);
      setSelectedScheme(scheme);
    }
  }, [form.scheme_id, schemes]);

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

  const fetchActiveSIPs = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/sip/active");
      if (!response.ok) throw new Error("Failed to fetch active SIPs");
      const data = await response.json();
      setActiveSIPs(data.data || data || []);
    } catch (err) {
      console.error("Error fetching active SIPs:", err);
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
    if (!form.amount || parseFloat(form.amount) < 100) {
      setError("Minimum SIP amount is ₹100");
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
    if (form.end_date && form.installments) {
      setError("Please provide either end date or number of installments, not both");
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
      const sipPayload = {
        scheme_id: form.scheme_id,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        installments: form.installments ? parseInt(form.installments) : null,
        bank_account_id: parseInt(form.bank_account_id),
      };

      const response = await fetchWithAuth("/api/investor/transactions/sip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sipPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "SIP setup failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `SIP Setup Successful! Reg ID: ${result.data?.sip_registration?.registration_id || "N/A"}`
      );

      setTimeout(() => {
        setForm({
          scheme_id: "",
          amount: "",
          frequency: "Monthly",
          start_date: "",
          end_date: "",
          installments: "",
          bank_account_id: "",
        });
        setSuccessMsg("");
        fetchActiveSIPs();
      }, 3000);
    } catch (err) {
      setError(err.message || "SIP setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Repeat className="w-8 h-8 text-green-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SIP Registration</h1>
              <p className="text-green-100 text-lg opacity-90">
                Automate your wealth creation journey
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
              {/* Scheme Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Mutual Fund Scheme <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.scheme_id}
                    onChange={(e) => setForm({ ...form, scheme_id: e.target.value })}
                    className="w-full pl-4 pr-10 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-all appearance-none"
                    required
                  >
                    <option value="">-- Choose a scheme --</option>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SIP Installment Amount <span className="text-red-500">*</span>
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
                      step="1"
                      placeholder="Min ₹100"
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
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
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
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
                  SIP Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Optional End Date / Installments */}
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  Duration (Optional) <span className="font-normal text-gray-500">- Select one</span>
                </h4>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Debit From Account <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.bank_account_id}
                    onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                    required
                  >
                    <option value="">-- Select Bank Account --</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id} disabled={account.mandate_status !== 'active'}>
                        {account.bank_name} - {account.account_number?.slice(-4)}
                        {account.mandate_status === 'active' ? " (Mandate Active)" : " (No Active Mandate)"}
                      </option>
                    ))}
                  </select>
                  <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
                {selectedBank && selectedBank.mandate_status !== 'active' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>This bank requires an active mandate for SIPs.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/bank-mandates')}
                      className="text-xs font-bold text-amber-900 underline hover:text-amber-700"
                    >
                      Setup Mandate
                    </button>
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
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Active SIPs List */}
        {activeSIPs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Your Active SIPs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Scheme</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Freq.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Next Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeSIPs.map((sip, index) => (
                    <tr key={sip.registration_id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{sip.scheme_id}</div>
                        <div className="text-xs text-gray-400 font-mono">#{sip.registration_id}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ₹{Number(sip.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {sip.frequency || "Monthly"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sip.next_installment_date
                          ? new Date(sip.next_installment_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                          {sip.total_installments_completed || 0} / {sip.number_of_installments || "∞"}
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
        {showReview && selectedScheme && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white text-center">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Review SIP</h3>
                <p className="text-green-100 text-sm">Verify your automation settings</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Scheme</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{selectedScheme.scheme_name || form.scheme_id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Amount/Installment</span>
                  <span className="font-bold text-xl text-green-600">₹{Number(form.amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Frequency</span>
                  <span className="font-semibold text-gray-900">{form.frequency}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">First Installment</span>
                  <span className="font-semibold text-gray-900">{form.start_date ? new Date(form.start_date).toLocaleDateString("en-IN") : "-"}</span>
                </div>
                {(form.end_date || form.installments) && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Duration Limit</span>
                    <span className="font-semibold text-gray-900">
                      {form.end_date ? `Until ${new Date(form.end_date).toLocaleDateString("en-IN")}` : `${form.installments} Installments`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Debit Account</span>
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
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? "Processing..." : "Confirm Setup"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
