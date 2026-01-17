import React, { useState } from "react";
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
    CheckCircle,
    AlertCircle,
    Mail,
    Smartphone as Phone,
    Globe,
    Zap,
    Save,
    Loader2
} from "lucide-react";

export default function Settings() {
    const { fetchWithAuth, user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Tabs Configuration
    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "security", label: "Security", icon: Shield },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "preferences", label: "Preferences", icon: Palette },
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
            if (!res.ok) throw new Error("Failed to update profile");
            setSuccessMsg("Profile updated successfully");
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
            setError("Passwords do not match");
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
            if (!res.ok) throw new Error("Failed to change password. check current password.");
            setSuccessMsg("Password changed successfully");
            setPasswords({ current: "", newPass: "", confirm: "" });
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper for input fields
    const InputField = ({ label, value, onChange, type = "text", icon: Icon, disabled = false, ...props }) => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'text-gray-900 bg-white'}`}
                    {...props}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white w-full font-sans">
            {/* Header */}
            <div className="mb-8 border-b border-gray-100 pb-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
            </div>

            {/* Error/Success Messages */}
            {(error || successMsg) && (
                <div className="mb-6">
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-4 rounded-lg text-red-700">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-700">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-medium">{successMsg}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setError(""); setSuccessMsg(""); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 max-w-4xl">
                    {activeTab === "profile" && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="p-6 border border-gray-100 rounded-xl shadow-sm bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        label="Full Name"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        icon={User}
                                    />
                                    <InputField
                                        label="Email Address"
                                        value={profileData.email}
                                        disabled
                                        icon={Mail}
                                    />
                                    <InputField
                                        label="Phone Number"
                                        value={profileData.phone_number}
                                        onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                                        icon={Phone}
                                    />
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Timezone</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <select className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed appearance-none" disabled>
                                                <option>{profileData.timezone}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {activeTab === "security" && (
                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            <div className="p-6 border border-gray-100 rounded-xl shadow-sm bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
                                <div className="space-y-4 max-w-lg">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type={showPass.current ? "text" : "password"}
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                            />
                                            <button type="button" onClick={() => setShowPass({ ...showPass, current: !showPass.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type={showPass.newPass ? "text" : "password"}
                                                value={passwords.newPass}
                                                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                            />
                                            <button type="button" onClick={() => setShowPass({ ...showPass, newPass: !showPass.newPass })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPass.newPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type={showPass.confirm ? "text" : "password"}
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                            />
                                            <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex justify-center items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {activeTab === "notifications" && (
                        <div className="space-y-6">
                            <div className="p-6 border border-gray-100 rounded-xl shadow-sm bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Email Notifications</h3>
                                <div className="space-y-4">
                                    {Object.entries(notifPrefs).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${value ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <Bell size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 capitalize">{key.replace('_', ' ')}</p>
                                                    <p className="text-xs text-gray-500">Receive an email for this activity.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !value })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "preferences" && (
                        <div className="space-y-6">
                            <div className="p-6 border border-gray-100 rounded-xl shadow-sm bg-white">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">App Preferences</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Theme</label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none">
                                            <option>Light (Default)</option>
                                            <option>Dark</option>
                                            <option>System</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Language</label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none">
                                            <option>English</option>
                                            <option>Hindi</option>
                                            <option>Tamil</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
