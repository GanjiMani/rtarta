import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
    User,
    Shield,
    Bell,
    Palette,
    Eye,
    EyeOff,
    Lock,
    Key,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Mail,
    Smartphone as Phone,
    Globe,
    Zap,
    ChevronRight,
    ShieldAlert,
    Save,
    Loader2,
    CreditCard,
    UserCheck,
    Activity,
    RefreshCw
} from "lucide-react";

export default function Settings() {
    const { fetchWithAuth, user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Tabs Configuration
    const tabs = [
        { id: "profile", label: "Public Profile", icon: User },
        { id: "security", label: "Security Vault", icon: Shield },
        { id: "notifications", label: "Alert Matrix", icon: Bell },
        { id: "preferences", label: "Portal Config", icon: Palette },
    ];

    // Profile Form State
    const [profileData, setProfileData] = useState({
        full_name: user?.name || "",
        email: user?.email || "",
        phone_number: user?.phone_number || "",
        communication_lang: "English (Global)",
        timezone: "IST (UTC +5:30)"
    });

    // Security Form State
    const [passwords, setPasswords] = useState({
        current: "",
        newPass: "",
        confirm: ""
    });
    const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });

    // Notification Matrix
    const [notifPrefs, setNotifPrefs] = useState({
        tx_alerts: true,
        security_alerts: true,
        marketing: false,
        yield_updates: true,
        system_status: false
    });

    const handleProfileUpdate = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMsg("");
        try {
            const res = await fetchWithAuth("/api/investor/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData)
            });
            if (!res.ok) throw new Error("Failed to update profile nodes");
            setSuccessMsg("Profile identity synchronized successfully");
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e?.preventDefault();
        if (passwords.newPass !== passwords.confirm) {
            setError("Sequence mismatch detected in key confirmation");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetchWithAuth("/api/investor/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: passwords.current,
                    new_password: passwords.newPass
                })
            });
            if (!res.ok) throw new Error("Key rotation failed. Verify legacy key.");
            setSuccessMsg("Cryptographic credentials updated");
            setPasswords({ current: "", newPass: "", confirm: "" });
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-white border-b border-slate-100 py-12 px-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 text-blue-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-3">
                            <Zap size={14} className="fill-blue-600" />
                            Portal Nexus v1.4
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">System Settings</h1>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/60">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setError(""); setSuccessMsg(""); }}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-16">
                {(error || successMsg) && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                        {error && (
                            <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-6 rounded-3xl text-rose-800">
                                <ShieldAlert className="w-6 h-6 text-rose-600" />
                                <p className="font-bold">{error}</p>
                            </div>
                        )}
                        {successMsg && (
                            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 p-6 rounded-3xl text-blue-800">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                <p className="font-bold">{successMsg}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-8">
                        {activeTab === "profile" && (
                            <form onSubmit={handleProfileUpdate} className="space-y-10">
                                <section>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Identity Profile</h3>
                                    <p className="text-slate-400 font-medium mb-8">Maintain your verified identity parameters within the RTA network.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                                            <div className="group relative">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={profileData.full_name}
                                                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                                            <div className="group relative">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="email"
                                                    disabled
                                                    value={profileData.email}
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl italic text-slate-400 cursor-not-allowed font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comm. Hub (Phone)</label>
                                            <div className="group relative">
                                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={profileData.phone_number}
                                                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regional Context</label>
                                            <div className="group relative">
                                                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <select className="w-full pl-14 pr-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-bold appearance-none cursor-not-allowed" disabled>
                                                    <option>{profileData.timezone}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-10">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-slate-300"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Commit Identity Changes
                                        </button>
                                    </div>
                                </section>
                            </form>
                        )}

                        {activeTab === "security" && (
                            <form onSubmit={handlePasswordUpdate} className="space-y-10">
                                <section>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Security Vault</h3>
                                    <p className="text-slate-400 font-medium mb-8">Maintain cryptographic integrity via manual key rotation protocols.</p>
                                    <div className="space-y-8 max-w-lg">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legacy Primary Key</label>
                                            <div className="group relative">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type={showPass.current ? "text" : "password"}
                                                    value={passwords.current}
                                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                    className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 tracking-widest"
                                                />
                                                <button type="button" onClick={() => setShowPass({ ...showPass, current: !showPass.current })} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors">
                                                    {showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deploy New Sequence</label>
                                            <div className="group relative">
                                                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type={showPass.newPass ? "text" : "password"}
                                                    value={passwords.newPass}
                                                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                                    className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 tracking-widest"
                                                />
                                                <button type="button" onClick={() => setShowPass({ ...showPass, newPass: !showPass.newPass })} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors">
                                                    {showPass.newPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seal Sequence (Confirm)</label>
                                            <div className="group relative">
                                                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type={showPass.confirm ? "text" : "password"}
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                    className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 tracking-widest"
                                                />
                                                <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors">
                                                    {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-4"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                                            Rotate Access Keys
                                        </button>
                                    </div>
                                </section>
                            </form>
                        )}

                        {activeTab === "notifications" && (
                            <section className="space-y-10">
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Alert Matrix</h3>
                                <p className="text-slate-400 font-medium mb-10">Configure threshold protocols for system relay notifications.</p>
                                <div className="space-y-6">
                                    {Object.entries(notifPrefs).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-3xl group hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-2xl ${value ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Bell size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{key.replace('_', ' ')}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">REAL-TIME SYNC ACTIVE</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !value })}
                                                className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${value ? 'bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.4)]' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeTab === "preferences" && (
                            <section className="space-y-12">
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Portal Configuration</h3>
                                <p className="text-slate-400 font-medium mb-10">Personalize your interaction interface and deployment visualization.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col justify-between group hover:border-blue-300 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.15em] mb-1">Theme Engine</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VISUAL ECOSYSTEM</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200/50">
                                                <Palette size={16} className="text-blue-500" />
                                            </div>
                                        </div>
                                        <div className="mt-8 flex bg-white p-1 rounded-2xl border border-slate-200/50 relative z-10">
                                            <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">White Prime</button>
                                            <button className="flex-1 py-3 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-600">Deep Slate</button>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col justify-between group hover:border-blue-300 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-[0.15em] mb-1">Language Node</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DATA LOCALIZATION</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200/50">
                                                <Globe size={16} className="text-blue-500" />
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none flex-1 appearance-none shadow-sm group-hover:border-blue-300 transition-all">
                                                <option>English (Institutional)</option>
                                                <option>Hindi (Standard)</option>
                                                <option>Tamil (Standard)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-6">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                            <span className="w-8 h-px bg-slate-200"></span>
                                            Operational Preferences
                                            <span className="flex-1 h-px bg-slate-200"></span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { id: 'hide_zero', label: 'Purge Zero-Balance Folios', desc: 'Auto-hide folios with no active deployment', icon: EyeOff },
                                                { id: 'compact_mode', label: 'High-Density Visualization', desc: 'Optimize ledger space for multi-asset views', icon: Zap },
                                                { id: 'market_sync', label: 'Real-Time Valuation', desc: 'Continuous NAV synchronization (High Bandwidth)', icon: RefreshCw },
                                                { id: 'paperless', label: 'Omni-Channel Digital Only', desc: 'Restrict physical mailing of statutory reports', icon: ShieldCheck }
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-pointer group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 rounded-2xl transition-all">
                                                            <item.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-800 tracking-tight">{item.label}</h5>
                                                            <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                    <button className="w-12 h-7 rounded-full bg-slate-100 relative px-1 transition-all group-hover:bg-slate-200">
                                                        <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-12 flex justify-end">
                                    <button className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                                        Synchronize Preferences
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="lg:col-span-4">
                        <div className="space-y-8 sticky top-32">
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-blue-500/20"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                            <Activity size={24} className="text-blue-400" />
                                        </div>
                                        <h4 className="text-xl font-black tracking-tight">Nexus Status</h4>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                            ID Verification <span className="text-emerald-400">PASSED</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                            2FA Protocol <span className="text-amber-400">STANDBY</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                            Cloud Sync <span className="text-blue-400">OPTIMAL</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full mt-4">
                                            <div className="h-full bg-blue-500 w-[85%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase text-center tracking-widest">System Trust Score: 850 / 1000</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">Security Notice</h4>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="min-w-[40px] h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-200/60">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">System keys are updated every 90 days. We recommend manual rotation for active traders.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="min-w-[40px] h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-200/60">
                                            <UserCheck size={18} />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Identity verification parameters are audited directly by regulatory checkpoints once per annum.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
