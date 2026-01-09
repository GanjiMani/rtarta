import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

export default function IDCWPreferences() {
  const { fetchWithAuth } = useAuth();
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (fetchWithAuth) {
      fetchPreferences();
    }
  }, [fetchWithAuth]);

  const fetchPreferences = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/idcw/preferences");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to load preferences");
      }
      const data = await response.json();
      setPreferences(data.data || []);
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
      idcw_option: newPreference.toLowerCase() === "payout" ? "payout" : "reinvestment"
    };
    setPreferences(updated);
    setSuccessMsg("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = preferences.map((pref) => ({
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
        throw new Error(errorData.detail || "Failed to save preferences");
      }

      const result = await response.json();
      setSuccessMsg(
        `IDCW preferences updated successfully for ${result.data?.updated_count || preferences.length} scheme(s)!`
      );
      
      // Refresh preferences
      await fetchPreferences();
    } catch (err) {
      setError(err.message || "Failed to save preferences");
      console.error("Error saving IDCW preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IDCW Preferences</h1>
          <p className="text-gray-600">
            Configure your Income Distribution cum Capital Withdrawal (IDCW) preferences for each scheme
          </p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading IDCW preferences...</p>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>IDCW Options:</strong> Choose whether dividends from your schemes should be paid out to your bank account (Payout) or automatically reinvested to purchase more units (Reinvestment).
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences List */}
            {preferences.length === 0 ? (
              <div className="bg-white shadow-lg rounded-xl p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Schemes Found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any active folios to configure IDCW preferences. Please make a purchase first.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Your Schemes</h3>
                  <p className="text-sm text-gray-600 mt-1">Select your preferred IDCW option for each scheme</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {preferences.map((pref, index) => (
                    <div key={pref.folio_number || index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{pref.scheme_name || pref.scheme_id}</h4>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Folio Number:</span> {pref.folio_number}</p>
                            <p><span className="font-medium">Current Preference:</span> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                (pref.preference || pref.idcw_option || "Payout").toLowerCase() === "payout" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {pref.preference || (pref.idcw_option === "payout" ? "Payout" : "Reinvestment")}
                              </span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <select
                            value={pref.preference || (pref.idcw_option === "payout" ? "Payout" : "Reinvest")}
                            onChange={(e) => handlePreferenceChange(index, e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[180px]"
                          >
                            <option value="Payout">Payout</option>
                            <option value="Reinvest">Reinvestment</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Option Details:</span>
                            <p className="mt-1 text-gray-900 font-medium">
                              {pref.preference === "Payout" || (pref.preference !== "Reinvest" && pref.idcw_option === "payout")
                                ? "Dividends will be credited to your registered bank account"
                                : "Dividends will be automatically reinvested to purchase additional units"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? "Saving..." : "Save All Preferences"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
