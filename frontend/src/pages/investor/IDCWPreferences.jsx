import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { CheckCircle, X, Info, TrendingUp, Wallet, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function IDCWPreferences() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState([]);
  const [originalPreferences, setOriginalPreferences] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (fetchWithAuth) fetchPreferences();
  }, [fetchWithAuth]);

  useEffect(() => {
    setHasChanges(JSON.stringify(preferences) !== JSON.stringify(originalPreferences));
  }, [preferences, originalPreferences]);

  const fetchPreferences = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth("/api/investor/idcw/preferences");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      const list = data.data || data || [];
      setPreferences(list);
      setOriginalPreferences(JSON.parse(JSON.stringify(list)));
    } catch (err) { setError("Failed to load preferences"); } finally { setLoading(false); }
  };

  const handlePreferenceChange = (index, newPreference) => {
    const updated = [...preferences];
    updated[index] = { ...updated[index], preference: newPreference };
    setPreferences(updated);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const payload = preferences.map((p) => ({ folio_number: p.folio_number, scheme_id: p.scheme_id, preference: p.preference }));
      const response = await fetchWithAuth("/api/investor/idcw/preferences", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save");
      setSaved(true); setOriginalPreferences(JSON.parse(JSON.stringify(preferences))); setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError("Failed to save"); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">IDCW Preferences</h1>
            <p className="text-gray-500 text-sm">Manage dividend payout vs reinvestment.</p>
          </div>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <button onClick={() => { setPreferences(JSON.parse(JSON.stringify(originalPreferences))); setHasChanges(false); }} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        )}
      </div>

      {saved && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded text-sm flex items-center gap-2"><CheckCircle size={16} /> Saved successfully!</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-sm flex items-center gap-2"><X size={16} /> {error}</div>}

      {preferences.length > 0 ? (
        <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Scheme</th>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Preference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {preferences.map((pref, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{pref.scheme_name || pref.scheme_id}</td>
                  <td className="px-4 py-3 text-gray-500">{pref.folio_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex bg-gray-100 rounded p-1 w-fit">
                      <button
                        onClick={() => handlePreferenceChange(i, "payout")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${pref.preference?.toLowerCase() === 'payout' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Payout
                      </button>
                      <button
                        onClick={() => handlePreferenceChange(i, "reinvestment")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${pref.preference?.toLowerCase() !== 'payout' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Reinvest
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center border border-gray-100 rounded-lg bg-gray-50 text-gray-500 text-sm">
          No applicable IDCW folios found.
        </div>
      )}
    </div>
  );
}
