import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { BadgeIndianRupee, CheckCircle, X, Info, RefreshCw, Wallet, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function IDCWPreferences() {
  const { fetchWithAuth, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState([]);
  const [originalPreferences, setOriginalPreferences] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchPreferences();
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    // Check if preferences have changed
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const fetchPreferences = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/idcw/preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch IDCW preferences");
      }
      const data = await response.json();
      const prefsList = data.data || data || [];
      setPreferences(prefsList);
      setOriginalPreferences(JSON.parse(JSON.stringify(prefsList)));
    } catch (err) {
      setError(err.message || "Failed to load IDCW preferences");
      console.error("Error fetching IDCW preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (index, newPreference) => {
    const updated = [...preferences];
    updated[index] = {
      ...updated[index],
      preference: newPreference,
    };
    setPreferences(updated);
  };

  const handleCancel = () => {
    setPreferences(JSON.parse(JSON.stringify(originalPreferences)));
    setHasChanges(false);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const payload = preferences.map((pref) => ({
        folio_number: pref.folio_number,
        scheme_id: pref.scheme_id,
        preference: pref.preference,
      }));

      const response = await fetchWithAuth("/api/investor/idcw/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save IDCW preferences");
      }

      setSaved(true);
      setOriginalPreferences(JSON.parse(JSON.stringify(preferences)));
      setHasChanges(false);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const getPreferenceIcon = (preference) => {
    return preference?.toLowerCase() === "payout" ? (
      <Wallet className="w-5 h-5 text-blue-600" />
    ) : (
      <TrendingUp className="w-5 h-5 text-green-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IDCW preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <BadgeIndianRupee className="w-8 h-8 text-indigo-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">IDCW Preferences</h1>
              <p className="text-indigo-100 text-lg opacity-90">
                Manage your Income Distribution & Capital Withdrawal preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">About IDCW Preferences</h3>
              <p className="text-sm text-blue-700">
                IDCW (Income Distribution & Capital Withdrawal) allows you to choose how dividends from your mutual fund investments are handled.
                Choose <strong>Payout</strong> to receive dividends directly in your bank account, or <strong>Reinvestment</strong> to automatically
                reinvest dividends back into the same scheme to benefit from compounding.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {saved && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">Preferences saved successfully!</p>
          </div>
        )}

        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">
              You have unsaved changes. Please save or cancel to continue.
            </p>
          </div>
        )}

        {/* Preferences List */}
        {preferences.length > 0 ? (
          <div className="space-y-4 mb-6">
            {preferences.map((pref, index) => {
              const isPayout = pref.preference?.toLowerCase() === "payout";
              return (
                <div
                  key={pref.folio_number || index}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-lg ${isPayout ? "bg-blue-100" : "bg-green-100"
                          }`}
                      >
                        {getPreferenceIcon(pref.preference)}
                      </div>

                      {/* Scheme Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {pref.scheme_name || pref.scheme_id}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Scheme ID: {pref.scheme_id} | Folio: {pref.folio_number || "N/A"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${isPayout
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-green-100 text-green-800 border border-green-200"
                              }`}
                          >
                            Current: {pref.preference || "Payout"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preference Selector */}
                    <div className="ml-4">
                      <div className="flex gap-3 items-center">
                        <label
                          className={`cursor-pointer px-4 py-2 rounded-lg border-2 transition-all ${!isPayout
                              ? "bg-green-50 border-green-500 text-green-700 font-semibold"
                              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                        >
                          <input
                            type="radio"
                            name={`preference-${index}`}
                            value="reinvestment"
                            checked={!isPayout}
                            onChange={() => handlePreferenceChange(index, "reinvestment")}
                            className="sr-only"
                          />
                          <span className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Reinvestment
                          </span>
                        </label>

                        <label
                          className={`cursor-pointer px-4 py-2 rounded-lg border-2 transition-all ${isPayout
                              ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                        >
                          <input
                            type="radio"
                            name={`preference-${index}`}
                            value="payout"
                            checked={isPayout}
                            onChange={() => handlePreferenceChange(index, "payout")}
                            className="sr-only"
                          />
                          <span className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Payout
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BadgeIndianRupee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">No IDCW Preferences Found</p>
            <p className="text-gray-500">
              You don't have any active folios with IDCW options. Start investing to set your preferences.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {preferences.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {hasChanges && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {hasChanges && (
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
