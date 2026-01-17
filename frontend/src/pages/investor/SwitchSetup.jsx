import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { ToggleLeft, CheckCircle, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

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

  useEffect(() => {
    if (fetchWithAuth) {
      fetchFolios();
      fetchSchemes();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (form.source_folio_number) {
      setSelectedSourceFolio(folios.find((f) => f.folio_number === form.source_folio_number));
    } else {
      setSelectedSourceFolio(null);
    }
    if (form.target_scheme_id) {
      setSelectedTargetScheme(schemes.find((s) => s.scheme_id === form.target_scheme_id));
    } else {
      setSelectedTargetScheme(null);
    }
  }, [form.source_folio_number, form.target_scheme_id, folios, schemes]);

  useEffect(() => {
    if (selectedSourceFolio && selectedTargetScheme) {
      const sNav = selectedSourceFolio.current_nav || 0;
      const tNav = selectedTargetScheme.current_nav || 0;
      if (tNav > 0) {
        if (form.switch_type === 'amount' && form.amount) {
          const val = parseFloat(form.amount);
          setEstimatedUnits(val / tNav);
        } else if (form.switch_type === 'units' && form.units) {
          const val = parseFloat(form.units) * sNav;
          setEstimatedUnits(val / tNav);
        } else if (form.switch_type === 'all') {
          const val = parseFloat(selectedSourceFolio.total_value);
          setEstimatedUnits(val / tNav);
        } else {
          setEstimatedUnits(0);
        }
      }
    }
  }, [form, selectedSourceFolio, selectedTargetScheme]);

  const fetchFolios = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/folios?active_only=true&with_units_only=true");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setFolios(data.data || data || []);
    } catch (err) { setError("Failed to load folios"); }
  };

  const fetchSchemes = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/schemes");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setSchemes(data.data || data || []);
    } catch (err) { setError("Failed to load schemes"); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    if (!form.source_folio_number) return setError("Select source folio");
    if (!form.target_scheme_id) return setError("Select target scheme");
    if (selectedSourceFolio && selectedSourceFolio.scheme_id === form.target_scheme_id) return setError("Schemes must be different");

    if (form.switch_type === "amount" && (!form.amount || parseFloat(form.amount) <= 0)) return setError("Invalid Amount");
    if (form.switch_type === "units" && (!form.units || parseFloat(form.units) <= 0)) return setError("Invalid Units");

    if (selectedSourceFolio && form.switch_type === "amount" && parseFloat(form.amount) > parseFloat(selectedSourceFolio.total_value)) return setError("Insufficient funds");
    if (selectedSourceFolio && form.switch_type === "units" && parseFloat(form.units) > parseFloat(selectedSourceFolio.total_units)) return setError("Insufficient units");

    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true); setShowReview(false); setError(""); setSuccessMsg("");
    try {
      const payload = { source_folio_number: form.source_folio_number, target_scheme_id: form.target_scheme_id };
      if (form.switch_type === "amount") payload.amount = parseFloat(form.amount);
      else if (form.switch_type === "units") payload.units = parseFloat(form.units);
      else if (form.switch_type === "all") payload.all_units = true;

      const response = await fetchWithAuth("/api/investor/transactions/switch", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Switch failed");
      const result = await response.json();
      setSuccessMsg(`Switch Successful! ID: ${result.data?.redemption_txn_id || "N/A"}`);
      setTimeout(() => {
        setForm({ source_folio_number: "", target_scheme_id: "", switch_type: "amount", amount: "", units: "", all_units: false });
        setSuccessMsg(""); fetchFolios(); navigate("/transactions");
      }, 3000);
    } catch (err) { setError(err.message || "Failed"); } finally { setLoading(false); }
  };

  const availableTargetSchemes = schemes.filter((s) => !selectedSourceFolio || s.scheme_id !== selectedSourceFolio.scheme_id);

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Switch Funds</h1>
          <p className="text-gray-500 text-sm">Transfer between schemes.</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}

      <div className="max-w-3xl mx-auto border border-gray-100 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Folio</label>
              <select value={form.source_folio_number} onChange={(e) => setForm({ ...form, source_folio_number: e.target.value, target_scheme_id: "" })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                <option value="">-- Select Source --</option>
                {folios.map((f) => <option key={f.folio_number} value={f.folio_number}>{f.scheme_name} - {f.folio_number}</option>)}
              </select>
              {selectedSourceFolio && <p className="text-xs text-green-600 mt-1">Val: ₹{Number(selectedSourceFolio.total_value).toLocaleString('en-IN')}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Scheme</label>
              <select value={form.target_scheme_id} onChange={(e) => setForm({ ...form, target_scheme_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required disabled={!form.source_folio_number}>
                <option value="">-- Select Target --</option>
                {availableTargetSchemes.map((s) => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Switch Type</label>
            <div className="flex gap-4">
              {[{ v: 'amount', l: 'Amount' }, { v: 'units', l: 'Units' }, { v: 'all', l: 'Switch All' }].map(o => (
                <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="stype" value={o.v} checked={form.switch_type === o.v} onChange={e => setForm({ ...form, switch_type: e.target.value })} className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            {form.switch_type === 'amount' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
              </div>
            )}
            {form.switch_type === 'units' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                <input type="number" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} min="0" step="0.0001" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
              </div>
            )}
            {selectedSourceFolio && selectedTargetScheme && (
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
                Est. Target Units: <strong>{estimatedUnits.toFixed(4)}</strong>
              </div>
            )}
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
              <h3 className="text-lg font-bold text-gray-900">Confirm Switch</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-medium text-right max-w-[200px] truncate">{selectedSourceFolio?.scheme_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-medium text-right max-w-[200px] truncate">{selectedTargetScheme?.scheme_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Est. Units</span><span className="font-bold text-blue-600">{estimatedUnits.toFixed(4)}</span></div>
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
