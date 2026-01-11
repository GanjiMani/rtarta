import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Users,
  UserPlus,
  Percent,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Loader2,
  CheckCircle2,
  Heart,
  ArrowRight,
  Info,
  Layers,
  Mail,
  Phone,
  MapPin,
  CreditCard
} from "lucide-react";

const nomineeRelations = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];

export default function NomineeManagement() {
  const { fetchWithAuth } = useAuth();
  const [nominees, setNominees] = useState([]);
  const [form, setForm] = useState({
    nominee_name: "",
    relationship: "",
    allocation_percentage: "",
    date_of_birth: "",
    nominee_pan: "",
    gender: "",
    mobile_number: "",
    email: "",
    address: "",
    guardian_name: "",
    guardian_pan: "",
    guardian_relation: ""
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNominees();
  }, [fetchWithAuth]);

  const fetchNominees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/profile`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Unable to fetch profile" }));
        throw new Error(errorData.detail || "Unable to fetch profile");
      }
      const response = await res.json();
      const nomineesList = (response.data?.nominees || []).map(nominee => ({
        nominee_id: nominee.id,
        nominee_name: nominee.nominee_name || nominee.full_name || "",
        relationship: nominee.relationship || nominee.nominee_relationship || "",
        allocation_percentage: nominee.allocation_percentage || 100,
        date_of_birth: nominee.date_of_birth || "",
        nominee_pan: nominee.nominee_pan || "",
        gender: nominee.gender || "",
        mobile_number: nominee.mobile_number || "",
        email: nominee.email || "",
        address: nominee.address || "",
        guardian_name: nominee.guardian_name || "",
        guardian_pan: nominee.guardian_pan || "",
        guardian_relation: nominee.guardian_relation || nominee.guardian_relationship || ""
      }));
      setNominees(nomineesList);
    } catch (err) {
      setError("Failed to load nominees: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addNominee = async (e) => {
    e?.preventDefault();
    const currentTotal = nominees.reduce((s, n) => s + Number(n.allocation_percentage || 0), 0);
    const total = currentTotal + Number(form.allocation_percentage || 0);

    if (!form.nominee_name || !form.relationship) {
      setError("Nominee Name and Relationship are strictly required.");
      return;
    }
    if (!form.allocation_percentage || form.allocation_percentage <= 0) {
      setError("Allocation percentage must be a positive integer.");
      return;
    }
    if (total > 100) {
      setError(`Total allocation exceeds 100% threshold. You have ${100 - currentTotal}% remaining.`);
      return;
    }
    if (!form.date_of_birth) {
      setError("Birth date record is mandatory for legal compliance.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        nominee_name: form.nominee_name,
        relationship: form.relationship,
        allocation_percentage: parseFloat(form.allocation_percentage),
        date_of_birth: form.date_of_birth,
        nominee_pan: form.nominee_pan,
        gender: form.gender,
        mobile_number: form.mobile_number,
        email: form.email,
        address: form.address,
        guardian_name: form.guardian_name,
        guardian_pan: form.guardian_pan,
        guardian_relation: form.guardian_relation,
      };
      const res = await fetchWithAuth(`/api/investor/profile/nominees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to add nominee" }));
        throw new Error(errorData.detail || "Failed to add nominee");
      }
      setSuccessMsg("Nomination rights securely recorded and archived.");
      setTimeout(() => setSuccessMsg(""), 5000);
      setForm({
        nominee_name: "",
        relationship: "",
        allocation_percentage: "",
        date_of_birth: "",
        nominee_pan: "",
        gender: "",
        mobile_number: "",
        email: "",
        address: "",
        guardian_name: "",
        guardian_pan: "",
        guardian_relation: ""
      });
      await fetchNominees();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeNominee = async (nomineeId) => {
    if (!window.confirm("Permanently revoke nomination rights for this entity?")) {
      return;
    }
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/nominees/${nomineeId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to delete nominee" }));
        throw new Error(errorData.detail || "Failed to delete nominee");
      }
      setSuccessMsg("Nominee record successfully purged from the legacy vault.");
      setTimeout(() => setSuccessMsg(""), 5000);
      await fetchNominees();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalAllocation = nominees.reduce((s, n) => s + Number(n.allocation_percentage || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
          <Users className="absolute inset-0 m-auto w-10 h-10 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Decrypting Nominees</h2>
        <p className="text-slate-500 font-medium mt-2">Initializing secure access to beneficiary data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 pt-16 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-400/30 mb-6">
            <Heart className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <span className="text-[10px] font-black uppercase text-emerald-100 tracking-[0.25em]">Succession Integrity</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            Beneficiary Vault
          </h1>
          <p className="text-emerald-50/80 font-medium max-w-2xl mx-auto text-xl leading-relaxed">
            Protect your legacy by designating legal heirs and allocating succession percentages across your portfolio.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 space-y-8">
        {/* Messages */}
        {(error || successMsg) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 max-w-2xl mx-auto">
            {error && (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-5 rounded-[2rem] text-rose-800 shadow-xl shadow-rose-900/5">
                <div className="p-2 bg-rose-100 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="font-bold">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] text-emerald-800 shadow-xl shadow-emerald-900/5">
                <div className="p-2 bg-emerald-100 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-bold">{successMsg}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Add Nominee Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-8">
              <div className="p-10 bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                  <UserPlus className="w-7 h-7 text-emerald-600" />
                  Register Nominee
                </h3>
              </div>
              <form onSubmit={addNominee} className="p-10 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 text-center lg:text-left">Legal Identity</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      placeholder="Full Legal Name"
                      value={form.nominee_name}
                      onChange={(e) => setForm({ ...form, nominee_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Relationship</label>
                    <div className="relative">
                      <select
                        required
                        value={form.relationship}
                        onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 appearance-none"
                      >
                        <option value="">Relation</option>
                        {nomineeRelations.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                      <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Birth Date</label>
                    <input
                      required
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">PAN Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        placeholder="ABCDE1234F"
                        maxLength="10"
                        value={form.nominee_pan}
                        onChange={(e) => setForm({ ...form, nominee_pan: e.target.value.toUpperCase() })}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 uppercase tracking-widest"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Mobile</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        placeholder="9999999999"
                        value={form.mobile_number}
                        onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        placeholder="nominee@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="Full Residential Address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1">Guardian (For Minors)</p>
                  <div>
                    <input
                      placeholder="Guardian Name"
                      value={form.guardian_name}
                      onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      placeholder="PAN"
                      maxLength="10"
                      value={form.guardian_pan}
                      onChange={(e) => setForm({ ...form, guardian_pan: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 uppercase tracking-widest"
                    />
                    <input
                      placeholder="Relation"
                      value={form.guardian_relation}
                      onChange={(e) => setForm({ ...form, guardian_relation: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Allocation Share (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g., 100"
                      value={form.allocation_percentage}
                      onChange={(e) => setForm({ ...form, allocation_percentage: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                    <Info className="w-3 h-3 text-amber-600" />
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tighter">Total must equal 100% across all entries</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3 mt-4 active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                  {isSubmitting ? "Processing..." : "Secure Registry"}
                </button>
              </form>
            </div>
          </div>

          {/* Current Nominees List */}
          <div className="lg:col-span-6 space-y-8">
            {/* Allocation Meter */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight">Succession Coverage</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {totalAllocation === 100 ? "Fully assigned" : `${100 - totalAllocation}% Available`}</p>
                </div>
                <div className={`p-4 rounded-3xl ${totalAllocation === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldCheck className="w-8 h-8" />
                </div>
              </div>

              <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full ${totalAllocation === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    }`}
                  style={{ width: `${totalAllocation}%` }}
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">0% Coverage</span>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest font-black">{totalAllocation}% Secure</span>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">100% Target</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {nominees.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                    <Users className="w-12 h-12 text-slate-200" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2">Registry Empty</h4>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">Establish your succession bridge by adding legal beneficiaries.</p>
                  <div className="inline-flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.2em] text-xs underline decoration-2 underline-offset-8">
                    Legally Binding Registry <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                nominees.map((nominee) => (
                  <div
                    key={nominee.nominee_id}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 transition-all duration-300 group hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-6 mb-6">
                          <div className="p-5 bg-slate-50 rounded-3xl group-hover:bg-emerald-50 transition-colors">
                            <Users className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-black text-slate-800 mb-1">{nominee.nominee_name || "N/A"}</h4>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 italic">
                                {nominee.relationship || "Legacy Contact"}
                              </span>
                              {nominee.date_of_birth && (
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(nominee.date_of_birth).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-1">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PAN & Gender</p>
                            <p className="text-xs font-bold text-slate-700 uppercase">{nominee.nominee_pan || "NA"} | {nominee.gender || "NA"}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact</p>
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {nominee.mobile_number || nominee.email ? (
                                <>{nominee.mobile_number} {nominee.email && `| ${nominee.email}`}</>
                              ) : "No contact identified"}
                            </p>
                          </div>
                        </div>

                        {nominee.address && (
                          <div className="mt-4 px-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address</p>
                            <p className="text-xs font-medium text-slate-600 truncate">{nominee.address}</p>
                          </div>
                        )}

                        {nominee.guardian_name && (
                          <div className="mt-4 px-4 py-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Guardian</p>
                            <p className="text-xs font-bold text-slate-800">
                              {nominee.guardian_name} ({nominee.guardian_relation || "Guardian"})
                              {nominee.guardian_pan && <span className="ml-2 text-slate-500">| {nominee.guardian_pan}</span>}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Allocation</p>
                          <p className="text-4xl font-black text-emerald-600 font-mono tracking-tighter">{nominee.allocation_percentage || 0}<span className="text-lg font-bold">%</span></p>
                        </div>
                        <button
                          onClick={() => removeNominee(nominee.nominee_id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Information Section */}
      <div className="max-w-6xl mx-auto px-6 mt-16 pb-20">
        <div className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h5 className="text-lg font-black text-slate-800 mb-3 tracking-tight">Legal Validity</h5>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Recorded nominations follow SEBI guidelines and serve as legal framework for succession planning.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center mb-6">
                <Layers className="w-8 h-8 text-teal-600" />
              </div>
              <h5 className="text-lg font-black text-slate-800 mb-3 tracking-tight">Multi-Asset Scope</h5>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Allocations defined here apply across all folios linked to your Investor ID automatically.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <Info className="w-8 h-8 text-slate-400" />
              </div>
              <h5 className="text-lg font-black text-slate-800 mb-3 tracking-tight">Easy Purge Flow</h5>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Revoke nomination rights at any time to reallocate percentages as family dynamics evolve.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}