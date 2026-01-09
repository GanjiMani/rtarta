import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";

export default function CASDownload() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [year, setYear] = useState(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (currentMonth <= 3) {
      return `${currentYear - 1}-${String(currentYear).slice(-2)}`;
    } else {
      return `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    }
  });

  const handleDownload = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      // Parse financial year to get date range
      const [startYear, endYearSuffix] = year.split('-');
      const endYear = 2000 + parseInt(endYearSuffix);
      const fromDate = `${startYear}-04-01`;
      const toDate = `${endYear}-03-31`;

      const response = await fetchWithAuth(
        `/api/investor/reports/cas?from_date=${fromDate}&to_date=${toDate}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to generate the CAS document");
      }

      const result = await response.json();
      const casData = result.data;

      // Generate Excel/CSV content from CAS data
      generateAndDownloadCAS(casData, year);
      
      setSuccessMsg(`CAS generated successfully for financial year ${year}! The file has been downloaded.`);
    } catch (err) {
      setError(err.message || "Failed to generate the CAS document. Please try again.");
      console.error("Error generating CAS:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownloadCAS = (casData, financialYear) => {
    // Generate CSV content
    let csvContent = "CONSOLIDATED ACCOUNT STATEMENT (CAS)\n";
    csvContent += `Financial Year: ${financialYear}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString("en-IN")}\n\n`;

    // Investor Information
    if (casData.investor_info) {
      csvContent += "INVESTOR INFORMATION\n";
      csvContent += `Investor ID: ${casData.investor_info.investor_id || "N/A"}\n`;
      csvContent += `Name: ${casData.investor_info.name || "N/A"}\n`;
      csvContent += `Email: ${casData.investor_info.email || "N/A"}\n`;
      csvContent += `PAN: ${casData.investor_info.pan || "N/A"}\n\n`;
    }

    // Statement Period
    if (casData.statement_period) {
      csvContent += "STATEMENT PERIOD\n";
      csvContent += `From: ${casData.statement_period.from_date || "N/A"}\n`;
      csvContent += `To: ${casData.statement_period.to_date || "N/A"}\n\n`;
    }

    // Schemes and Transactions
    if (casData.schemes && casData.schemes.length > 0) {
      casData.schemes.forEach((scheme, schemeIndex) => {
        csvContent += `\n${"=".repeat(80)}\n`;
        csvContent += `SCHEME ${schemeIndex + 1}: ${scheme.scheme_name || scheme.scheme_id}\n`;
        csvContent += `${"=".repeat(80)}\n`;
        csvContent += `Scheme ID: ${scheme.scheme_id || "N/A"}\n`;
        csvContent += `AMC Name: ${scheme.amc_name || "N/A"}\n`;
        csvContent += `Folio Number: ${scheme.folio_number || "N/A"}\n\n`;

        // Current Holdings
        if (scheme.current_holdings) {
          csvContent += "CURRENT HOLDINGS\n";
          csvContent += `Units: ${scheme.current_holdings.units || 0}\n`;
          csvContent += `NAV: ₹${scheme.current_holdings.nav || 0}\n`;
          csvContent += `Current Value: ₹${scheme.current_holdings.value || 0}\n\n`;
        }

        // Transactions
        if (scheme.transactions && scheme.transactions.length > 0) {
          csvContent += "TRANSACTION HISTORY\n";
          csvContent += "Date,Transaction ID,Type,Amount (₹),Units,NAV,Status\n";
          
          scheme.transactions.forEach((txn) => {
            csvContent += `${txn.date || "N/A"},${txn.transaction_id || "N/A"},${txn.type || "N/A"},₹${txn.amount || 0},${txn.units || 0},₹${txn.nav || 0},${txn.status || "N/A"}\n`;
          });
        } else {
          csvContent += "No transactions in this period.\n";
        }
        csvContent += "\n";
      });
    } else {
      csvContent += "\nNo schemes or holdings found.\n";
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CAS_${financialYear}_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consolidated Account Statement (CAS)</h1>
          <p className="text-gray-600">
            Download your consolidated statement for all folios and transactions serviced by this RTA
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

        {/* CAS Download Card */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Generate CAS</h3>
            <p className="text-sm text-gray-600 mt-1">Select a financial year to generate your consolidated account statement</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>About CAS:</strong> A Consolidated Account Statement (CAS) provides a complete view of all your mutual fund investments across different AMCs and schemes. It includes current holdings and transaction history for the selected period.
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Year Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Financial Year <span className="text-red-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2021-22">2021-22</option>
                <option value="2020-21">2020-21</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                The statement will include transactions from April 1 to March 31 of the selected financial year
              </p>
            </div>

            {/* Period Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Statement Period</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">From:</span>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const [startYear] = year.split('-');
                      return `${startYear}-04-01`;
                    })()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">To:</span>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const [, endYearSuffix] = year.split('-');
                      const endYear = 2000 + parseInt(endYearSuffix);
                      return `${endYear}-03-31`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating CAS...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download CAS (CSV)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">What's Included in CAS?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Investor information and PAN details</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Current holdings across all schemes and folios</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Complete transaction history for the selected period</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>NAV details and unit balance information</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
