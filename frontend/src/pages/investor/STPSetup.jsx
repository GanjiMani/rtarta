import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { RefreshCw, CheckCircle, ArrowRight, AlertCircle, Calendar, ArrowLeft } from "lucide-react";

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
      setSelectedSourceFolio(folios.find((f) => f.folio_number === form.source_folio_number));
    }
    if (form.target_scheme_id) {
      setSelectedTargetScheme(schemes.find((s) => s.scheme_id === form.target_scheme_id));
    }
  }, [form.source_folio_number, form.target_scheme_id, folios, schemes]);

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

  const fetchActiveSTPs = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/stp/active");
      if (response.ok) {
        const data = await response.json();
        setActiveSTPs(data.data || data || []);
      }
    } catch (e) { }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    if (!form.source_folio_number) return setError("Select source folio");
    if (!form.target_scheme_id) return setError("Select target scheme");
    if (selectedSourceFolio && selectedSourceFolio.scheme_id === form.target_scheme_id) return setError("Source/Target must carry different schemes");
    if (!form.amount || parseFloat(form.amount) < 500) return setError("Min STP amount ₹500");
    if (selectedSourceFolio && parseFloat(form.amount) > parseFloat(selectedSourceFolio.total_value || 0)) return setError("Insufficient funds");
    if (!form.start_date) return setError("Select start date");

    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true); setShowReview(false); setError(""); setSuccessMsg("");
    try {
      const payload = {
        source_folio_number: form.source_folio_number, target_scheme_id: form.target_scheme_id,
        amount: parseFloat(form.amount), frequency: form.frequency,
        start_date: form.start_date, end_date: form.end_date || null,
        installments: form.installments ? parseInt(form.installments) : null,
      };

      const response = await fetchWithAuth("/api/investor/transactions/stp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("STP setup failed");
      const result = await response.json();
      setSuccessMsg(`STP Registered! ID: ${result.data?.stp_registration?.registration_id || "N/A"}`);
      setTimeout(() => {
        setForm({ source_folio_number: "", target_scheme_id: "", amount: "", frequency: "Monthly", start_date: "", end_date: "", installments: "" });
        setSuccessMsg(""); fetchActiveSTPs(); fetchFolios();
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
          <h1 className="text-xl font-bold text-gray-900">STP Registration</h1>
          <p className="text-gray-500 text-sm">Systematic Transfer Plan.</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="border border-gray-100 rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From (Source)</label>
                  <select value={form.source_folio_number} onChange={(e) => setForm({ ...form, source_folio_number: e.target.value, target_scheme_id: "" })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                    <option value="">-- Select Source --</option>
                    {folios.map((f) => <option key={f.folio_number} value={f.folio_number}>{f.scheme_name} - {f.folio_number}</option>)}
                  </select>
                  {selectedSourceFolio && <p className="text-xs text-green-600 mt-1">Avail: ₹{Number(selectedSourceFolio.total_value).toLocaleString('en-IN')}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To (Target)</label>
                  <select value={form.target_scheme_id} onChange={(e) => setForm({ ...form, target_scheme_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required disabled={!form.source_folio_number}>
                    <option value="">-- Select Target --</option>
                    {availableTargetSchemes.map((s) => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                  </select>
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
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
              <h3 className="text-sm font-bold text-gray-900">Active STPs</h3>
            </div>
            {activeSTPs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activeSTPs.map((stp, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50">
                    <p className="text-xs font-medium text-gray-900 mb-1">From: {stp.source_scheme_id}</p>
                    <p className="text-xs text-gray-500 mb-1">To: {stp.target_scheme_id}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-900">₹{Number(stp.amount).toLocaleString('en-IN')}</span>
                      <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100">{stp.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">No active STPs found.</div>
            )}
          </div>
        </div>
      </div>

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Confirm STP</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-medium text-right max-w-[200px] truncate">{selectedSourceFolio?.scheme_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-medium text-right max-w-[200px] truncate">{selectedTargetScheme?.scheme_name}</span></div>
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
