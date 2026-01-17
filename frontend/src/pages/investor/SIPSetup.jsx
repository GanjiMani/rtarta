import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Repeat, CheckCircle, ArrowRight, AlertCircle, Landmark, Clock, ArrowLeft } from "lucide-react";

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
      setSelectedScheme(schemes.find((s) => s.scheme_id === form.scheme_id));
    }
  }, [form.scheme_id, schemes]);

  const fetchSchemes = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/schemes");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setSchemes(data.data || data || []);
    } catch (err) { setError("Failed to load schemes"); }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/profile");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setBankAccounts((data.data || {}).bank_accounts || []);
    } catch (err) { setError("Failed to load banks"); }
  };

  const fetchActiveSIPs = async () => {
    try {
      const response = await fetchWithAuth("/api/investor/transactions/sip/active");
      if (response.ok) {
        const data = await response.json();
        setActiveSIPs(data.data || data || []);
      }
    } catch (e) { }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    if (!form.scheme_id) return setError("Please select a scheme");
    if (!form.amount || parseFloat(form.amount) < 100) return setError("Min SIP amount ₹100");
    if (!form.start_date) return setError("Please select start date");
    if (!form.bank_account_id) return setError("Please select bank account");
    if (form.end_date && form.installments) return setError("Either End Date or No. of Installments");

    setShowReview(true);
  };

  const handleConfirm = async () => {
    setLoading(true); setShowReview(false); setError(""); setSuccessMsg("");
    try {
      const payload = {
        scheme_id: form.scheme_id, amount: parseFloat(form.amount), frequency: form.frequency,
        start_date: form.start_date, end_date: form.end_date || null,
        installments: form.installments ? parseInt(form.installments) : null,
        bank_account_id: parseInt(form.bank_account_id),
      };

      const response = await fetchWithAuth("/api/investor/transactions/sip", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("SIP setup failed");
      const result = await response.json();
      setSuccessMsg(`SIP Setup Successful! ID: ${result.data?.sip_registration?.registration_id || "N/A"}`);
      setTimeout(() => {
        setForm({ scheme_id: "", amount: "", frequency: "Monthly", start_date: "", end_date: "", installments: "", bank_account_id: "" });
        setSuccessMsg(""); fetchActiveSIPs();
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
          <h1 className="text-xl font-bold text-gray-900">SIP Registration</h1>
          <p className="text-gray-500 text-sm">Automate your investments.</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="border border-gray-100 rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Scheme</label>
                <select value={form.scheme_id} onChange={(e) => setForm({ ...form, scheme_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                  <option value="">-- Select Scheme --</option>
                  {schemes.map((s) => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="100" step="1" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm" required />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Debit From</label>
                  <div className="relative">
                    <select value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white" required>
                      <option value="">-- Select Bank --</option>
                      {bankAccounts.map((b) => (<option key={b.id} value={b.id} disabled={b.mandate_status !== 'active'}>{b.bank_name} - {b.account_number.slice(-4)} {b.mandate_status === 'active' ? '' : '(No Mandate)'}</option>))}
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

        {/* Active SIPs Sidebar */}
        <div className="md:col-span-1">
          <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden h-fit">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Active SIPs</h3>
            </div>
            {activeSIPs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activeSIPs.map((sip, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50">
                    <p className="text-xs font-medium text-gray-900 truncate mb-1" title={sip.scheme_id}>{sip.scheme_id}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{sip.frequency}</span>
                      <span className="font-bold text-gray-900">₹{Number(sip.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400">
                      <span>Next: {sip.next_installment_date ? new Date(sip.next_installment_date).toLocaleDateString() : '-'}</span>
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">{sip.total_installments_completed || 0} Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">No active SIPs found.</div>
            )}
          </div>
        </div>
      </div>

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Confirm SIP</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Scheme</span><span className="font-medium text-right max-w-[200px] truncate">{selectedScheme?.scheme_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-blue-600">₹{Number(form.amount).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Frequency</span><span className="font-medium">{form.frequency}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium">{form.start_date}</span></div>
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
