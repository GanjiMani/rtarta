import React, { useEffect, useState } from "react";
import { useAuth } from "../../services/AuthContext";

export default function ValuationReport() {
  const { fetchWithAuth } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fetchWithAuth) {
      fetchData();
    }
  }, [fetchWithAuth]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/reports/valuation");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to load valuation data");
      }
      const result = await response.json();
      setReportData(result.data || null);
    } catch (err) {
      setError(err.message || "Failed to load valuation report");
      console.error("Error fetching valuation:", err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData?.folio_valuations || reportData.folio_valuations.length === 0) return;
    
    const rows = reportData.folio_valuations.map((folio) => ({
      "Folio Number": folio.folio_number,
      "Scheme Name": folio.scheme_name,
      "Scheme Type": folio.scheme_type,
      "Total Units": parseFloat(folio.total_units || 0).toFixed(4),
      "Current NAV (₹)": parseFloat(folio.current_nav || 0).toFixed(4),
      "Current Value (₹)": parseFloat(folio.current_value || 0).toFixed(2),
      "Total Investment (₹)": parseFloat(folio.total_investment || 0).toFixed(2),
      "Gain/Loss (₹)": parseFloat(folio.gain_loss || 0).toFixed(2),
      "Gain/Loss (%)": parseFloat(folio.gain_loss_percentage || 0).toFixed(2),
      "Last Updated": folio.last_updated || new Date().toISOString().split('T')[0]
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) => Object.values(r).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valuation_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Valuation Report</h1>
          <p className="text-gray-600">
            View your complete portfolio valuation with current holdings and performance metrics
          </p>
        </div>

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
            <p className="mt-4 text-gray-600">Loading valuation report...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Folios</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.total_folios || 0}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Investment</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(parseFloat(reportData.total_investment || 0))}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Current Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(parseFloat(reportData.total_current_value || 0))}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={`bg-white shadow-lg rounded-xl p-6 border-l-4 ${
                parseFloat(reportData.total_gain_loss || 0) >= 0 ? "border-green-500" : "border-red-500"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Gain/Loss</p>
                    <p className={`text-2xl font-bold ${
                      parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(parseFloat(reportData.total_gain_loss || 0))}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPercentage(reportData.total_gain_loss_percentage || 0)}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${
                    parseFloat(reportData.total_gain_loss || 0) >= 0 ? "bg-green-100" : "bg-red-100"
                  }`}>
                    <svg className={`w-6 h-6 ${
                      parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {parseFloat(reportData.total_gain_loss || 0) >= 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Date Info */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Report Date: {reportData.report_date ? new Date(reportData.report_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            {reportData.folio_valuations && reportData.folio_valuations.length === 0 ? (
              <div className="bg-white shadow-lg rounded-xl p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Holdings Found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any active folios in your portfolio. Please make a purchase to start investing.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Folio Holdings</h3>
                    <p className="text-sm text-gray-600 mt-1">Detailed breakdown of your portfolio holdings</p>
                  </div>
                  <button
                    onClick={downloadCSV}
                    disabled={!reportData?.folio_valuations || reportData.folio_valuations.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Folio Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheme Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheme Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Units
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current NAV (₹)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Value (₹)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Investment (₹)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gain/Loss (₹)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gain/Loss (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.folio_valuations.map((folio, idx) => {
                        const gainLoss = parseFloat(folio.gain_loss || 0);
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {folio.folio_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {folio.scheme_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {folio.scheme_type?.replace("_", " ") || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {parseFloat(folio.total_units || 0).toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(parseFloat(folio.current_nav || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                              {formatCurrency(parseFloat(folio.current_value || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(parseFloat(folio.total_investment || 0))}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                              gainLoss >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {formatCurrency(gainLoss)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                              gainLoss >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {formatPercentage(folio.gain_loss_percentage || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Summary Row */}
                    <tfoot className="bg-gray-50">
                      <tr className="font-semibold">
                        <td colSpan="3" className="px-6 py-4 text-sm text-gray-900">
                          Total
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {reportData.folio_valuations.reduce((sum, f) => sum + parseFloat(f.total_units || 0), 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-right">-</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {formatCurrency(parseFloat(reportData.total_current_value || 0))}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {formatCurrency(parseFloat(reportData.total_investment || 0))}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right ${
                          parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatCurrency(parseFloat(reportData.total_gain_loss || 0))}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right ${
                          parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatPercentage(reportData.total_gain_loss_percentage || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
            <p className="mt-2 text-sm text-gray-500">
              Unable to load valuation report. Please try again later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
