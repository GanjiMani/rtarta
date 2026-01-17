import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function SecuritySettings() {
  const { fetchWithAuth } = useAuth();
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return setError("Passwords do not match");
    if (passwords.newPass.length < 8) return setError("Password must be at least 8 characters");

    setLoading(true); setError(""); setSuccessMsg("");
    try {
      const res = await fetchWithAuth(`/api/investor/auth/change-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.newPass }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("Password updated successfully"); setTimeout(() => setSuccessMsg(""), 3000);
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) { setError("Failed to change password. Check current password."); } finally { setLoading(false); }
  };

  const toggle = (field) => setShow(p => ({ ...p, [field]: !p[field] }));

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-gray-500 text-sm">Update your password and security preferences.</p>
          </div>
        </div>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      <div className="max-w-xl">
        <div className="border border-gray-100 rounded-lg shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} /> Change Password</h3>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input type={show.current ? "text" : "password"} required value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm pr-10" />
                <button type="button" onClick={() => toggle('current')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><Eye size={16} /></button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={show.newPass ? "text" : "password"} required value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm pr-10" />
                <button type="button" onClick={() => toggle('newPass')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><Eye size={16} /></button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input type={show.confirm ? "text" : "password"} required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm pr-10" />
                <button type="button" onClick={() => toggle('confirm')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><Eye size={16} /></button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? "Updating..." : "Update Password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}