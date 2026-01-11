import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { TrendingUp, Download, Calendar, AlertCircle, CheckCircle, Info, FileText } from "lucide-react";

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map(h => {
      const val = r[h];
      // Escape commas and quotes in values
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(",")),
  ].join("\\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CapitalGainsReport() {
  const { fetchWithAuth } = useAuth();
  const [year, setYear] = useState("2024-25");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchData();
    }
  }, [year, fetchWithAuth]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth(`/api/investor/reports/capital-gains?financial_year=${year}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to load capital gains report");
      }
      const result = await response.json();
      setReportData(result.data || {});
    } catch (err) {
      setError(err.message || "Failed to load capital gains report");
      console.error("Error fetching capital gains:", err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const shortTermGains = reportData?.capital_gains?.short_term || {};
  const longTermGains = reportData?.capital_gains?.long_term || {};
  const summary = reportData?.summary || {};

  const allTransactions = [
    ...(shortTermGains.transactions || []).map(t => ({ ...t, type: "Short Term" })),
    ...(longTermGains.transactions || []).map(t => ({ ...t, type: "Long Term" }))
  ];

  const prepareCSVData = () => {
    return allTransactions.map(txn => ({
      "Transaction ID": txn.transaction_id,
      "Scheme": txn.scheme_name || txn.scheme_id,
      "Purchase Date": formatDate(txn.purchase_date),
      "Redemption Date": formatDate(txn.redemption_date),
      "Units": txn.units?.toFixed(4) || "0.0000",
      "Purchase NAV": formatCurrency(txn.purchase_nav),
      "Redemption NAV": formatCurrency(txn.redemption_nav),
      "Cost Basis": formatCurrency(txn.cost_basis),
      "Sale Value": formatCurrency(txn.sale_value),
      "Gain/Loss": formatCurrency(txn.gain_loss),
      "Holding Period (Years)": txn.holding_period_years || 0,
      "Type": txn.type,
      "Asset Class": txn.is_equity ? "Equity" : "Debt"
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <TrendingUp className="w-8 h-8 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Capital Gains Report</h1>
              <p className="text-emerald-100 text-lg opacity-90">
                Comprehensive tax report with FIFO calculation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 max-w-7xl mx-auto -mt-8 relative z-10">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Calculating capital gains...</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-semibold text-gray-700" htmlFor="financialYear">
                    Financial Year:
                  </label>
                  <select
                    id="financialYear"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2022-23">2022-23</option>
                    <option value="2021-22">2021-22</option>
                  </select>
                </div>
                <button
                  onClick={() => downloadCSV(`capital_gains_${year}.csv`, prepareCSVData())}
                  disabled={allTransactions.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download CSV
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {reportData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Short Term Gains</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_short_term)}</p>
                      <p className="text-xs text-gray-500 mt-1">{shortTermGains.count || 0} transactions</p>
                    </div>
                    <div className="bg-orange-100 rounded-full p-3">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Long Term Gains</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_long_term)}</p>
                      <p className="text-xs text-gray-500 mt-1">{longTermGains.count || 0} transactions</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Taxable Gain</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_taxable_gain)}</p>
                      <p className="text-xs text-gray-500 mt-1">{summary.total_transactions || 0} total</p>
                    </div>
                    <div className="bg-emerald-100 rounded-full p-3">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Period Info */}
            {reportData?.period && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl mb-6 shadow-sm">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold">Report Period: {formatDate(reportData.period.start_date)} to {formatDate(reportData.period.end_date)}</p>
                    <p className="text-xs mt-1 opacity-90">Calculations use FIFO (First In First Out) method for cost basis</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {allTransactions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Capital Gains Transactions</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No redemptions found for financial year {year}. Capital gains are calculated when you redeem or switch out of mutual fund schemes.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-xl font-bold text-gray-900">Detailed Capital Gains</h3>
                  <p className="text-sm text-gray-600 mt-1">Transaction-wise breakdown with holding period and tax classification</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheme</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Redemption</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Basis</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Value</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gain/Loss</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Holding</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {allTransactions.map((txn, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{txn.scheme_name || txn.scheme_id}</div>
                            <div className="text-xs text-gray-400">{txn.transaction_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(txn.purchase_date)}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(txn.purchase_nav)}/unit</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(txn.redemption_date)}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(txn.redemption_nav)}/unit</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                            {txn.units?.toFixed(4) || "0.0000"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(txn.cost_basis)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(txn.sale_value)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                            <span className={txn.gain_loss >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(txn.gain_loss)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900">{txn.holding_period_years || 0} yrs</div>
                            <div className="text-xs text-gray-500">{txn.holding_period_days || 0} days</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${txn.type === "Long Term"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                              }`}>
                              {txn.type}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{txn.is_equity ? "Equity" : "Debt"}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tax Information Footer */}
            {reportData?.tax_implications && (
              <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-5 rounded-xl shadow-sm">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold text-amber-900 mb-2">Tax Implications (As per Indian Tax Laws)</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong>Short-term capital gains:</strong> {reportData.tax_implications.stcg_tax_rate}</li>
                      <li><strong>Long-term capital gains (Equity):</strong> {reportData.tax_implications.ltcg_equity_tax_rate}</li>
                      <li><strong>Long-term capital gains (Debt):</strong> {reportData.tax_implications.ltcg_debt_tax_rate}</li>
                    </ul>
                    <p className="mt-2 text-xs opacity-90">{reportData.tax_implications.note}</p>
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
