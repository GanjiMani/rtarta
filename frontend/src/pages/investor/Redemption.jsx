import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { DollarSign, CheckCircle, ArrowRight, Info, AlertCircle, Landmark, ArrowLeft } from "lucide-react";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    if (!form.folio_number) return setError("Please select a folio");
    if (!form.bank_account_id) return setError("Please select a bank account");
    if (form.redemption_type === "amount" && (!form.amount || parseFloat(form.amount) <= 0)) return setError("Invalid amount");
    if (form.redemption_type === "units" && (!form.units || parseFloat(form.units) <= 0)) return setError("Invalid units");

    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true); setShowReview(false); setError(""); setSuccessMsg("");
    try {
      const payload = { folio_number: form.folio_number };
      if (form.redemption_type === "amount") payload.amount = parseFloat(form.amount);
      else if (form.redemption_type === "units") payload.units = parseFloat(form.units);
      else if (form.redemption_type === "all") payload.all_units = true;

      const response = await fetchWithAuth("/api/investor/transactions/redemption", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Redemption failed");
      const result = await response.json();
      setSuccessMsg(`Redemption successful! ID: ${result.data?.transaction?.transaction_id || "N/A"}`);
      setTimeout(() => {
        setForm({ folio_number: "", redemption_type: "amount", amount: "", units: "", all_units: false, bank_account_id: "" });
        setSuccessMsg(""); fetchFolios(); navigate("/transactions");
      }, 3000);
    } catch (err) { setError(err.message || "Redemption failed"); } finally { setLoading(false); }
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
          <h1 className="text-xl font-bold text-gray-900">Redemption</h1>
          <p className="text-gray-500 text-sm">Withdraw funds from portfolio.</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}

      <div className="max-w-3xl mx-auto border border-gray-100 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Folio</label>
              <select
                value={form.folio_number}
                onChange={(e) => {
                  const folio = folios.find(f => f.folio_number === e.target.value);
                  setForm({ ...form, folio_number: e.target.value });
                  setSelectedFolio(folio);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                required
              >
                <option value="">-- Select Folio --</option>
                {folios.map(f => <option key={f.folio_number} value={f.folio_number}>{f.scheme_name} - {f.folio_number}</option>)}
              </select>
              {selectedFolio && (
                <div className="mt-2 text-xs text-gray-500 flex gap-4">
                  <span>Value: <strong>₹{Number(selectedFolio.total_value).toLocaleString('en-IN')}</strong></span>
                  <span>Units: <strong>{Number(selectedFolio.total_units).toFixed(3)}</strong></span>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Redemption Type</label>
              <div className="flex gap-4">
                {[{ v: 'amount', l: 'Amount' }, { v: 'units', l: 'Units' }, { v: 'all', l: 'Redeem All' }].map(opt => (
                  <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rtype" value={opt.v} checked={form.redemption_type === opt.v} onChange={e => setForm({ ...form, redemption_type: e.target.value })} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{opt.l}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.redemption_type === 'amount' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
                {selectedFolio && <p className="text-xs text-gray-500 mt-1">Est. Units: {estimatedUnits.toFixed(4)}</p>}
              </div>
            )}

            {form.redemption_type === 'units' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                <input type="number" value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} min="0" step="0.0001" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
                {selectedFolio && <p className="text-xs text-gray-500 mt-1">Est. Amount: ₹{estimatedAmount.toLocaleString('en-IN')}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Account</label>
              <div className="relative">
                <select value={form.bank_account_id} onChange={e => setForm({ ...form, bank_account_id: e.target.value })} className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                  <option value="">-- Select --</option>
                  {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number.slice(-4)}</option>)}
                </select>
                <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate("/dashboard")} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">{loading ? "Processing..." : <>Review <ArrowRight size={14} /></>}</button>
          </div>
        </form>
      </div>

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Confirm Redemption</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Scheme</span><span className="font-medium text-right max-w-[200px] truncate">{selectedFolio?.scheme_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="font-bold text-blue-600">₹{form.redemption_type === 'amount' ? Number(form.amount).toLocaleString('en-IN') : estimatedAmount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">{selectedBank?.bank_name}</span></div>
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
