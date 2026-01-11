import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet
} from "lucide-react";

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

  const handleDownload = async (format = 'csv') => {
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

      if (format === 'csv') {
        generateAndDownloadCSV(casData, year);
        setSuccessMsg(`CAS (CSV) generated successfully for FY ${year}!`);
      } else if (format === 'print') {
        handlePrint(casData, year);
      }

    } catch (err) {
      setError(err.message || "Failed to generate the CAS document. Please try again.");
      console.error("Error generating CAS:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownloadCSV = (casData, financialYear) => {
    // Generate CSV content with better formatting
    let csvRows = [];

    // Header Section
    csvRows.push(["CONSOLIDATED ACCOUNT STATEMENT (CAS)"]);
    csvRows.push(["Financial Year", financialYear]);
    csvRows.push(["Generated on", new Date().toLocaleString("en-IN")]);
    csvRows.push([]);

    // Investor Information
    if (casData.investor_info) {
      csvRows.push(["INVESTOR INFORMATION"]);
      csvRows.push(["Name", casData.investor_info.name || "N/A"]);
      csvRows.push(["Email", casData.investor_info.email || "N/A"]);
      csvRows.push(["PAN", casData.investor_info.pan || "N/A"]);
      csvRows.push([]);
    }

    // Statement Period
    if (casData.statement_period) {
      csvRows.push(["STATEMENT PERIOD"]);
      csvRows.push(["From", casData.statement_period.from_date || "N/A"]);
      csvRows.push(["To", casData.statement_period.to_date || "N/A"]);
      csvRows.push([]);
    }

    // Schemes and Transactions
    if (casData.schemes && casData.schemes.length > 0) {
      casData.schemes.forEach((scheme) => {
        csvRows.push(["--------------------------------------------------------------------------------"]);
        csvRows.push([`SCHEME: ${scheme.scheme_name || scheme.scheme_id}`]);
        csvRows.push(["--------------------------------------------------------------------------------"]);
        csvRows.push(["AMC Name", scheme.amc_name || "N/A"]);
        csvRows.push(["Folio Number", scheme.folio_number || "N/A"]);
        csvRows.push([]);

        // Current Holdings
        if (scheme.current_holdings) {
          csvRows.push(["CURRENT HOLDINGS"]);
          csvRows.push(["Units", scheme.current_holdings.units || 0]);
          csvRows.push(["Current NAV", `INR ${scheme.current_holdings.nav || 0}`]);
          csvRows.push(["Current Value", `INR ${scheme.current_holdings.value || 0}`]);
          csvRows.push([]);
        }

        // Transactions
        if (scheme.transactions && scheme.transactions.length > 0) {
          csvRows.push(["TRANSACTION HISTORY"]);
          csvRows.push(["Date", "Transaction ID", "Type", "Amount (INR)", "Units", "NAV", "Status"]);

          scheme.transactions.forEach((txn) => {
            csvRows.push([
              txn.date || "N/A",
              txn.transaction_id || "N/A",
              txn.type || "N/A",
              txn.amount || 0,
              txn.units || 0,
              txn.nav || 0,
              txn.status || "N/A"
            ]);
          });
        } else {
          csvRows.push(["No transactions in this period."]);
        }
        csvRows.push([]);
        csvRows.push([]);
      });
    } else {
      csvRows.push(["No schemes or holdings found."]);
    }

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CAS_${financialYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (casData, financialYear) => {
    // Create a printable version in a new window/iframe
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>CAS Statement - FY ${financialYear}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
            h2 { color: #065f46; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 8px; margin-bottom: 20px; }
            .label { font-weight: 600; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { text-align: left; background: #f9fafb; padding: 10px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 10px; border-bottom: 1px solid #f3f4f6; }
            .scheme-header { background: #ecfdf5; padding: 15px; margin-top: 40px; border-radius: 8px; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #9ca3af; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">Confirm Print</button>
          </div>
          <h1>Consolidated Account Statement (CAS)</h1>
          <div class="info-grid">
            <div class="label">Financial Year:</div><div>${financialYear}</div>
            <div class="label">Name:</div><div>${casData.investor_info?.name || 'N/A'}</div>
            <div class="label">PAN:</div><div>${casData.investor_info?.pan || 'N/A'}</div>
            <div class="label">Period:</div><div>${casData.statement_period?.from_date} to ${casData.statement_period?.to_date}</div>
          </div>

          ${casData.schemes.map(scheme => `
            <div class="scheme-header">
              <h3 style="margin: 0;">${scheme.scheme_name}</h3>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #374151;">Folio: ${scheme.folio_number} | AMC: ${scheme.amc_name}</p>
            </div>
            
            <div style="margin-top: 15px;">
              <span class="label">Current Units:</span> ${scheme.current_holdings?.units} | 
              <span class="label">Current Value:</span> INR ${scheme.current_holdings?.value}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Units</th>
                  <th>NAV</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${scheme.transactions.map(txn => `
                  <tr>
                    <td>${txn.date}</td>
                    <td>${txn.type}</td>
                    <td>${txn.amount}</td>
                    <td>${txn.units}</td>
                    <td>${txn.nav}</td>
                    <td>${txn.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}

          <div class="footer">
            Generated on ${new Date().toLocaleString()} | Digital Statement - No signature required
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 pb-32 pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Consolidated Account Statement</h1>
              </div>
              <p className="text-emerald-50 text-lg opacity-90 max-w-2xl">
                Get a comprehensive view of all your mutual fund investments, holdings, and transaction history in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-12">
        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <p className="text-emerald-800 font-medium">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Generate Statement</h2>
                <Info className="w-5 h-5 text-slate-400 cursor-help" />
              </div>

              <div className="p-8 space-y-8">
                {/* Year Selection */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    SELECT FINANCIAL YEAR
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["2025-26", "2024-25", "2023-24", "2022-23", "2021-22", "2020-21"].map((fy) => (
                      <button
                        key={fy}
                        onClick={() => setYear(fy)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${year === fy
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/30"
                          }`}
                      >
                        {fy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Summary */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <p className="text-slate-500 mb-1">From Date</p>
                      <p className="font-bold text-slate-900">{year.split('-')[0]}-04-01</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="flex-1">
                      <p className="text-slate-500 mb-1">To Date</p>
                      <p className="font-bold text-slate-900">{2000 + parseInt(year.split('-')[1])}-03-31</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => handleDownload('csv')}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                    DOWNLOAD CSV
                  </button>
                  <button
                    onClick={() => handleDownload('print')}
                    disabled={loading}
                    className="flex-1 bg-white border-2 border-slate-200 hover:border-emerald-600 hover:text-emerald-600 text-slate-700 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Printer className="w-5 h-5" />
                    PRINT / PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Why use CAS?</h4>
                <p className="text-blue-800/80 text-sm leading-relaxed">
                  The Consolidated Account Statement (CAS) is a single statement of all your mutual fund investments across AMCs.
                  It's official, comprehensive, and helps in easy tracking of your portfolio value and tax planning.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Included in Report</h3>
              <div className="space-y-4">
                {[
                  "Complete Profile Information",
                  "Consolidated Unit Balance",
                  "Current Portfolio Valuation",
                  "Detailed Transaction History",
                  "Dividend / IDCW History",
                  "Bank Mandate Details"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="p-1 bg-emerald-100 rounded-full">
                      <ChevronRight className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-900 rounded-2xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="font-bold mb-2">Need Help?</h3>
                <p className="text-emerald-100/80 text-sm mb-4">
                  Discrepancy in your statement? Contact our support team for clarification.
                </p>
                <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors">
                  CONTACT SUPPORT
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <FileText className="w-32 h-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
