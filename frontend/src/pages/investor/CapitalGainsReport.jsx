import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const csv = [
    Object.keys(rows[0]).join(","),
    ...rows.map((r) => Object.values(r).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
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
  const [tableData, setTableData] = useState([]);

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
      
      // Backend returns an object, not an array
      const data = result.data || {};
      setReportData(data);
      
      // Transform backend data into table format
      const transformedData = [];
      
      // Add short-term capital gains transactions
      if (data.capital_gains?.short_term?.transactions) {
        data.capital_gains.short_term.transactions.forEach((txn) => {
          transformedData.push({
            "Transaction ID": txn.transaction_id || "N/A",
            "Scheme ID": txn.scheme_id || "N/A",
            "Date": txn.date ? new Date(txn.date).toLocaleDateString() : "N/A",
            "Amount (₹)": formatCurrency(txn.amount || 0),
            "Gain/Loss (₹)": formatCurrency(txn.gain_loss || 0),
            "Type": "Short Term"
          });
        });
      }
      
      // Add long-term capital gains transactions
      if (data.capital_gains?.long_term?.transactions) {
        data.capital_gains.long_term.transactions.forEach((txn) => {
          transformedData.push({
            "Transaction ID": txn.transaction_id || "N/A",
            "Scheme ID": txn.scheme_id || "N/A",
            "Date": txn.date ? new Date(txn.date).toLocaleDateString() : "N/A",
            "Amount (₹)": formatCurrency(txn.amount || 0),
            "Gain/Loss (₹)": formatCurrency(txn.gain_loss || 0),
            "Type": "Long Term"
          });
        });
      }
      
      setTableData(transformedData);
    } catch (err) {
      setError(err.message || "Failed to load capital gains report");
      console.error("Error fetching capital gains:", err);
      setReportData(null);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const shortTermTotal = reportData?.capital_gains?.short_term?.total || 0;
  const longTermTotal = reportData?.capital_gains?.long_term?.total || 0;
  const totalTaxableGain = reportData?.total_taxable_gain || (shortTermTotal + longTermTotal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Capital Gains Report</h1>
          <p className="text-gray-600">
            View your capital gains and losses for tax reporting purposes
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
            <p className="mt-4 text-gray-600">Loading capital gains report...</p>
          </div>
        ) : (
          <>
            {/* Financial Year Selector and Download */}
            <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="financialYear">
                    Financial Year:
                  </label>
                  <select
                    id="financialYear"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2022-23">2022-23</option>
                    <option value="2021-22">2021-22</option>
                  </select>
                </div>
                <button
                  onClick={() => downloadCSV(`capital_gains_${year}.csv`, tableData)}
                  disabled={tableData.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {reportData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Short Term Capital Gains</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(shortTermTotal)}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Long Term Capital Gains</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(longTermTotal)}</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Taxable Gain</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalTaxableGain)}</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Period Info */}
            {reportData?.period && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Report Period: {reportData.period.start_date ? new Date(reportData.period.start_date).toLocaleDateString() : "N/A"} to {reportData.period.end_date ? new Date(reportData.period.end_date).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {tableData.length === 0 ? (
              <div className="bg-white shadow-lg rounded-xl p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Capital Gains Data</h3>
                <p className="mt-2 text-sm text-gray-500">
                  No capital gains transactions found for financial year {year}. 
                  {reportData?.period && ` The period covers ${reportData.period.start_date ? new Date(reportData.period.start_date).toLocaleDateString() : ""} to ${reportData.period.end_date ? new Date(reportData.period.end_date).toLocaleDateString() : ""}.`}
                </p>
              </div>
            ) : (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Capital Gains Transactions</h3>
                  <p className="text-sm text-gray-600 mt-1">Detailed breakdown of all capital gains and losses</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.length > 0 && Object.keys(tableData[0]).map((key, idx) => (
                          <th
                            key={idx}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            scope="col"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.map((record, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(record).map((val, i) => (
                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tax Information Footer */}
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium text-yellow-900 mb-1">Tax Information</p>
                  <p>
                    Short-term capital gains (held for less than 1 year) are taxed at your applicable income tax rate. 
                    Long-term capital gains (held for more than 1 year) on equity funds are taxed at 10% (without indexation) 
                    or 20% (with indexation), whichever is lower. Please consult with a tax advisor for accurate tax calculations.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
