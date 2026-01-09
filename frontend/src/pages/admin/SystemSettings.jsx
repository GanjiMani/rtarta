import { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function SystemSettings() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState([]);
  const [originalSettings, setOriginalSettings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const settingsList = data.settings || [];
        setSettings(settingsList);
        setOriginalSettings(JSON.parse(JSON.stringify(settingsList)));
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (index, newValue) => {
    setSettings((prevSettings) => {
      const updated = [...prevSettings];
      updated[index] = { ...updated[index], setting_value: newValue };
      return updated;
    });
    setMessage(null);
  };

  const validateTime = (time) => /^\d{2}:\d{2}$/.test(time);

  const isValidSetting = (setting) => {
    if (setting.setting_key.includes("Time")) return validateTime(setting.setting_value);
    if (setting.setting_key.includes("Amount")) return !isNaN(setting.setting_value) && Number(setting.setting_value) > 0;
    return true;
  };

  const allValid = settings.every(isValidSetting);
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    if (!allValid || !hasChanges) return;

    try {
      setSaving(true);
      setMessage(null);

      // Update each changed setting
      const updates = {};
      for (let i = 0; i < settings.length; i++) {
        if (settings[i].setting_value !== originalSettings[i]?.setting_value && !settings[i].is_readonly) {
          updates[settings[i].setting_key] = settings[i].setting_value;
        }
      }

      const res = await fetchWithAuth("/admin/settings/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchSettings();
        setMessage({ type: "success", text: "System settings saved successfully." });
      } else {
        setMessage({ type: "error", text: "Failed to save settings." });
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure system-wide settings and parameters</p>
      </div>

      {message && (
        <div
          role="alert"
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Setting", "Value", "Description"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings.map((setting, index) => {
                const valid = isValidSetting(setting);
                return (
                  <tr key={setting.setting_key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {setting.setting_key}
                      {setting.is_readonly && (
                        <span className="ml-2 text-xs text-gray-500">(Read-only)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {setting.is_readonly ? (
                        <span className="text-sm text-gray-900">{setting.setting_value}</span>
                      ) : (
                        <>
                          <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              valid ? "" : "border-red-500 bg-red-50"
                            }`}
                            value={setting.setting_value}
                            onChange={(e) => handleValueChange(index, e.target.value)}
                          />
                          {!valid && (
                            <p role="alert" className="text-red-600 text-xs mt-1">
                              {setting.setting_key.includes("Time")
                                ? "Invalid time format (HH:mm expected)"
                                : setting.setting_key.includes("Amount")
                                ? "Must be a positive number"
                                : "Invalid value"}
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {setting.description || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !allValid || !hasChanges}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors ${
            saving || !allValid || !hasChanges
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>

        <button
          onClick={handleReset}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Changes
        </button>
      </div>
    </div>
  );
}
