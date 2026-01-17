import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Download, RefreshCw, AlertCircle, ArrowLeft, TrendingUp, TrendingDown, FileText } from "lucide-react";

export default function ValuationReport() {
  const { fetchWithAuth } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fetchWithAuth) fetchData();
  }, [fetchWithAuth]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth("/api/investor/reports/valuation");
      if (!response.ok) throw new Error("Failed");
      const result = await response.json();
      setReportData(result.data || null);
    } catch (err) { setError("Failed to load report"); setReportData(null); } finally { setLoading(false); }
  };

  const downloadCSV = () => {
    if (!reportData?.folio_valuations?.length) return;
    const rows = reportData.folio_valuations.map((f) => [f.folio_number, f.scheme_name, f.scheme_type, f.total_units, f.current_nav, f.current_value, f.total_investment, f.gain_loss, f.gain_loss_percentage]);
    const csv = [["Folio", "Scheme", "Type", "Units", "NAV", "Value", "Invested", "Gain/Loss", "%"].join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `Valuation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0);
  const formatPercentage = (val) => `${parseFloat(val || 0).toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Portfolio Valuation Report</h1>
            <p className="text-gray-500 text-sm">Investment performance summary.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-50 rounded"><RefreshCw size={18} /></button>
          <button onClick={downloadCSV} disabled={!reportData?.folio_valuations?.length} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"><Download size={14} /> CSV</button>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {loading ? (<div className="p-12 text-center text-gray-500">Loading...</div>) : reportData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Inv.</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(reportData.total_investment)}</p>
            </div>
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Current Value</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(reportData.total_current_value)}</p>
            </div>
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Gain/Loss</p>
              <div className={`flex items-center gap-1 text-lg font-bold ${reportData.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.total_gain_loss)}
                {reportData.total_gain_loss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
            </div>
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Returns</p>
              <p className={`text-lg font-bold ${reportData.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercentage(reportData.total_gain_loss_percentage)}</p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Holdings Detail</h3>
              <span className="text-xs text-gray-500">As of {new Date(reportData.report_date || new Date()).toLocaleDateString()}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr><th>Scheme</th><th className="text-right">Units</th><th className="text-right">NAV</th><th className="text-right">Invested</th><th className="text-right">Value</th><th className="text-right">Gain/Loss</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.folio_valuations?.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{f.scheme_name}</div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-400">{f.folio_number}</span>
                          <span className="bg-gray-100 text-gray-600 px-1 rounded">{f.scheme_type?.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{Number(f.total_units).toFixed(4)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(f.current_nav)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(f.total_investment)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(f.current_value)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-bold ${f.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(f.gain_loss)}</div>
                        <div className={`text-xs ${f.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercentage(f.gain_loss_percentage)}</div>
                      </td>
                    </tr>
                  ))}
                  {!reportData.folio_valuations?.length && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No holdings found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
