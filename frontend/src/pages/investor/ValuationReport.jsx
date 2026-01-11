import React, { useEffect, useState } from "react";
import { useAuth } from "../../services/AuthContext";
import { Download, RefreshCw, TrendingUp, TrendingDown, PieChart, FileText, AlertCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Generating valuation report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-1">Portfolio Valuation Report</h1>
          <p className="text-indigo-100 text-lg opacity-90">
            Comprehensive breakdown of your investments and performance
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Investment</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(reportData.total_investment || 0))}
                </h3>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">Current Value</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(reportData.total_current_value || 0))}
                </h3>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Gain/Loss</p>
                <div className={`flex items-baseline gap-2 ${parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(parseFloat(reportData.total_gain_loss || 0))}
                  </h3>
                  {parseFloat(reportData.total_gain_loss || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">XIRR / Returns</p>
                <h3 className={`text-2xl font-bold ${parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                  {formatPercentage(reportData.total_gain_loss_percentage || 0)}
                </h3>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Holdings Detail</h2>
                  <p className="text-sm text-gray-500">
                    Report as of {reportData.report_date ? new Date(reportData.report_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={downloadCSV}
                    disabled={!reportData?.folio_valuations || reportData.folio_valuations.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>
              </div>

              {reportData.folio_valuations && reportData.folio_valuations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheme / Folio</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">NAV</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Invested</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Value</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {reportData.folio_valuations.map((folio, idx) => {
                        const gainLoss = parseFloat(folio.gain_loss || 0);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{folio.scheme_name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200">
                                    {folio.scheme_type?.replace(/_/g, " ") || "Fund"}
                                  </span>
                                  <span className="text-xs text-gray-500 font-mono">{folio.folio_number}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                              {parseFloat(folio.total_units || 0).toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                              {formatCurrency(parseFloat(folio.current_nav || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                              {formatCurrency(parseFloat(folio.total_investment || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                              {formatCurrency(parseFloat(folio.current_value || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className={`text-sm font-bold ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(gainLoss)}
                              </div>
                              <div className={`text-xs font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatPercentage(folio.gain_loss_percentage || 0)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold border-t border-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Total Portfolio</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {reportData.folio_valuations.reduce((sum, f) => sum + parseFloat(f.total_units || 0), 0).toFixed(4)}
                        </td>
                        <td colSpan="1"></td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(parseFloat(reportData.total_investment || 0))}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(parseFloat(reportData.total_current_value || 0))}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm ${parseFloat(reportData.total_gain_loss || 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                          {formatCurrency(parseFloat(reportData.total_gain_loss || 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No holdings found</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Your portfolio is currently empty. Start investing to see your valuation report here.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
