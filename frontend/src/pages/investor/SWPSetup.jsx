import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Shuffle, CheckCircle, ArrowRight, AlertCircle, Landmark, Calendar, ArrowLeft } from "lucide-react";

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
      setSelectedFolio(folios.find((f) => f.folio_number === form.folio_number));
    }
  }, [form.folio_number, folios]);

  const fetchFolios = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/folios?active_only=true&with_units_only=true");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setFolios(data.data || data || []);
    } catch (err) { setError("Failed to load folios"); }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setBankAccounts((data.data || {}).bank_accounts || []);
    } catch (err) { setError("Failed to load banks"); }
  };

  const fetchActiveSWPs = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/swp/active");
      if (response.ok) {
        const data = await response.json();
        setActiveSWPs(data.data || data || []);
      }
    } catch (e) { }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    if (!form.folio_number) return setError("Please select a folio");
    if (!form.amount || parseFloat(form.amount) < 500) return setError("Min SWP amount ₹500");
    if (selectedFolio && parseFloat(form.amount) > parseFloat(selectedFolio.total_value || 0)) return setError("Insufficient funds");
    if (!form.start_date) return setError("Please select start date");
    if (!form.bank_account_id) return setError("Please select bank account");

    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true); setShowReview(false); setError(""); setSuccessMsg("");
    try {
      const payload = {
        folio_number: form.folio_number, amount: parseFloat(form.amount), frequency: form.frequency,
        start_date: form.start_date, end_date: form.end_date || null,
        installments: form.installments ? parseInt(form.installments) : null,
        bank_account_id: parseInt(form.bank_account_id),
      };

      const response = await fetchWithAuth("/api/investor/transactions/swp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("SWP setup failed");
      const result = await response.json();
      setSuccessMsg(`SWP Registered! ID: ${result.data?.swp_registration?.registration_id || "N/A"}`);
      setTimeout(() => {
        setForm({ folio_number: "", amount: "", frequency: "Monthly", start_date: "", end_date: "", installments: "", bank_account_id: "" });
        setSuccessMsg(""); fetchActiveSWPs(); fetchFolios();
      }, 3000);
    } catch (err) { setError(err.message || "Failed"); } finally { setLoading(false); }
  };

  const selectedBank = bankAccounts.find((ba) => ba.id === parseInt(form.bank_account_id));

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SWP Registration</h1>
          <p className="text-gray-500 text-sm">Systematic Withdrawal Plan.</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="border border-gray-100 rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Folio</label>
                <select value={form.folio_number} onChange={(e) => setForm({ ...form, folio_number: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                  <option value="">-- Select Folio --</option>
                  {folios.map((f) => <option key={f.folio_number} value={f.folio_number}>{f.scheme_name} - {f.folio_number}</option>)}
                </select>
                {selectedFolio && (
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>Value: ₹{Number(selectedFolio.total_value).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="500" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit To</label>
                  <div className="relative">
                    <select value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                      <option value="">-- Select Bank --</option>
                      {bankAccounts.map((b) => (<option key={b.id} value={b.id}>{b.bank_name} - {b.account_number.slice(-4)}</option>))}
                    </select>
                    <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase">Duration (Optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value, installments: "" })} min={form.start_date} disabled={!!form.installments} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">No. of Installments</label>
                    <input type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value, end_date: "" })} min="1" disabled={!!form.end_date} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white disabled:bg-gray-100" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => navigate("/dashboard")} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">{loading ? "Processing..." : <>Review <ArrowRight size={14} /></>}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden h-fit">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Active SWPs</h3>
            </div>
            {activeSWPs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activeSWPs.map((swp, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50">
                    <p className="text-xs font-medium text-gray-900 truncate mb-1" title={swp.scheme_id}>{swp.scheme_id}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{swp.frequency}</span>
                      <span className="font-bold text-gray-900">₹{Number(swp.amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">No active SWPs found.</div>
            )}
          </div>
        </div>
      </div>

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Confirm SWP</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="font-medium text-right max-w-[200px] truncate">{selectedFolio?.scheme_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-blue-600">₹{Number(form.amount).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Frequency</span><span className="font-medium">{form.frequency}</span></div>
            </div>
            <div className="p-4 flex gap-3">
              <button onClick={() => setShowReview(false)} className="flex-1 py-2 border border-gray-200 rounded text-gray-600 text-sm hover:bg-gray-50">Back</button>
              <button onClick={handleConfirm} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">{loading ? "Processing..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
