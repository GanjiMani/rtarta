import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  ArrowRight,
  Loader2,
  RefreshCw,
  LogOut,
  Smartphone,
  ShieldHalf
} from "lucide-react";

export default function SecuritySettings() {
  const { fetchWithAuth } = useAuth();
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: ""
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    newPass: false,
    confirm: false
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordStrengthColor, setPasswordStrengthColor] = useState("");
  const [passwordStrengthPercent, setPasswordStrengthPercent] = useState(0);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Calculate password strength
  useEffect(() => {
    if (!passwords.newPass) {
      setPasswordStrength("");
      setPasswordStrengthColor("");
      setPasswordStrengthPercent(0);
      return;
    }

    let strength = 0;

    // Check length
    if (passwords.newPass.length >= 8) strength += 20;
    if (passwords.newPass.length >= 12) strength += 10;
    // Check for uppercase
    if (/[A-Z]/.test(passwords.newPass)) strength += 20;
    // Check for lowercase
    if (/[a-z]/.test(passwords.newPass)) strength += 10;
    // Check for numbers
    if (/[0-9]/.test(passwords.newPass)) strength += 20;
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(passwords.newPass)) strength += 20;

    let strengthText = "";
    let color = "";

    if (strength <= 30) {
      strengthText = "Vulnerable";
      color = "bg-rose-500 text-rose-600";
    } else if (strength <= 60) {
      strengthText = "Intermediate";
      color = "bg-amber-500 text-amber-600";
    } else if (strength <= 90) {
      strengthText = "Secure";
      color = "bg-emerald-500 text-emerald-600";
    } else {
      strengthText = "Unbreakable";
      color = "bg-teal-500 text-teal-600";
    }

    setPasswordStrength(strengthText);
    setPasswordStrengthColor(color);
    setPasswordStrengthPercent(strength);
  }, [passwords.newPass]);

  const validatePassword = () => {
    if (!passwords.current) {
      setError("Authorization requires your current cryptographic key (password).");
      return false;
    }
    if (!passwords.newPass) {
      setError("Please define a new security sequence.");
      return false;
    }
    if (passwords.newPass.length < 8) {
      setError("Security sequence must be at least 8 units long.");
      return false;
    }
    if (passwords.newPass === passwords.current) {
      setError("New sequence must be distinct from the legacy key.");
      return false;
    }
    if (passwords.newPass !== passwords.confirm) {
      setError("Confirmation sequence does not match the primary input.");
      return false;
    }
    return true;
  };

  const changePassword = async (e) => {
    e?.preventDefault();
    if (!validatePassword()) return;

    setIsChangingPassword(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetchWithAuth(`/api/investor/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.newPass,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to rotate security keys." }));
        throw new Error(errData.detail || "Failed to rotate security keys.");
      }

      setSuccessMsg("Shield updated. New security protocol active.");
      setTimeout(() => setSuccessMsg(""), 5000);
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 pt-16 pb-28 px-6 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-400/30 mb-6">
            <Fingerprint className="w-4 h-4 text-emerald-200" />
            <span className="text-[10px] font-black uppercase text-emerald-100 tracking-[0.25em]">End-to-End Encryption</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            Security Core
          </h1>
          <p className="text-emerald-50/80 font-medium max-w-xl mx-auto text-xl leading-relaxed">
            Manage your account's defense systems and cryptographic credentials.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16 space-y-8">
        {/* Messages */}
        {(error || successMsg) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {error && (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] text-rose-800 shadow-xl shadow-rose-900/5">
                <div className="p-2 bg-rose-100 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                </div>
                <p className="font-bold">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] text-emerald-800 shadow-xl shadow-emerald-900/5">
                <div className="p-2 bg-emerald-100 rounded-2xl">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-bold">{successMsg}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Change Password Panel */}
          <div className="lg:col-span-12">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                    <Key className="w-8 h-8 text-emerald-600" />
                    Rotate Credentials
                  </h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Last rotated: 90 days target</p>
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-lg shadow-slate-200/50">
                  <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin-slow" />
                </div>
              </div>

              <form onSubmit={changePassword} className="p-10 max-w-2xl mx-auto space-y-8">
                <div className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Archive Key (Current)</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        required
                        type={showPassword.current ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full pl-14 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 text-lg tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl transition-all"
                      >
                        {showPassword.current ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-emerald-600" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <div className="flex items-center justify-between mb-3 ml-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deploy New Sequence</label>
                      {passwordStrength && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${passwordStrengthColor.split(' ')[1].replace('text-', 'bg-').replace('-600', '-50')} ${passwordStrengthColor.split(' ')[1]}`}>
                          {passwordStrength}
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        required
                        type={showPassword.newPass ? "text" : "password"}
                        placeholder="New Sequence"
                        value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        className="w-full pl-14 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 text-lg tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("newPass")}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl transition-all"
                      >
                        {showPassword.newPass ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-emerald-600" />}
                      </button>
                    </div>
                    {/* Strength Meter */}
                    <div className="mt-4 px-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full transition-all duration-700 ease-out rounded-full ${passwordStrengthColor.split(' ')[0]}`}
                          style={{ width: `${passwordStrengthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Seal Sequence (Confirm)</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        required
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Confirm Sequence"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className={`w-full pl-14 pr-14 py-5 bg-slate-50 border rounded-[1.5rem] focus:ring-4 outline-none transition-all font-bold text-slate-700 text-lg tracking-widest ${passwords.confirm && passwords.newPass !== passwords.confirm
                            ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                            : "border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl transition-all"
                      >
                        {showPassword.confirm ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-emerald-600" />}
                      </button>
                    </div>
                    {passwords.confirm && passwords.newPass !== passwords.confirm && (
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1">Inconsistent Sequence Detected</p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-4 active:scale-[0.98]"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ShieldHalf className="w-6 h-6" />
                    )}
                    {isChangingPassword ? "Enforcing Policy..." : "Update Security Shield"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security Protocols / Tips */}
          <div className="lg:col-span-12">
            <div className="bg-slate-900 rounded-[3.5rem] p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mt-32 blur-[80px]"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-black tracking-tight">Active Sessions</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Your account is currently active on 2 verified devices. Review and terminate unknown origins if detected.</p>
                </div>

                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-black tracking-tight">Encryption Flow</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">All transaction keys are processed using AES-256 standards with peripheral integrity audits.</p>
                </div>

                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <LogOut className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-black tracking-tight">Automatic Seal</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">System automatically revokes access after 15 minutes of inactivity to prevent physical breach.</p>
                </div>

                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <AlertCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-black tracking-tight">Security Alert</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Suspicious attempts will trigger immediate lockdown and relay an SMS unit to your linked mobile.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Support Signal */}
      <div className="max-w-4xl mx-auto px-6 mt-12 mb-12 text-center">
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3">
          Shield Status <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Optimal
        </p>
      </div>
    </div>
  );
}