import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, AlertCircle, TrendingUp, CheckCircle, FileText } from "lucide-react";

export default function CapitalGainsReport() {
  const { fetchWithAuth } = useAuth();
  const [year, setYear] = useState("2024-25");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) fetchData();
  }, [year, fetchWithAuth]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth(`/api/investor/reports/capital-gains?financial_year=${year}`);
      if (!response.ok) throw new Error("Failed");
      const result = await response.json();
      setReportData(result.data || {});
    } catch (err) { setError("Failed to load report"); setReportData(null); } finally { setLoading(false); }
  };

  const downloadReport = () => {
    if (!reportData) return;
    const headers = ["Scheme", "Purchase Date", "Redemption Date", "Units", "Buy NAV", "Sell NAV", "Cost", "Value", "Gain/Loss", "Type"];
    const shortTerm = reportData.capital_gains?.short_term?.transactions || [];
    const longTerm = reportData.capital_gains?.long_term?.transactions || [];
    const rows = [...shortTerm.map(t => ({ ...t, type: 'Short Term' })), ...longTerm.map(t => ({ ...t, type: 'Long Term' }))];

    const csvContent = [
      headers.join(","),
      ...rows.map(r => [
        r.scheme_name, r.purchase_date, r.redemption_date, r.units, r.purchase_nav, r.redemption_nav, r.cost_basis, r.sale_value, r.gain_loss, r.type
      ].join(","))
    ].join("\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.download = `CapitalGains_${year}.csv`;
    link.click();
  };

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0);

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Capital Gains Report</h1>
            <p className="text-gray-500 text-sm">Tax report for your redemptions.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded text-sm bg-white outline-none focus:border-blue-500">
            {["2025-26", "2024-25", "2023-24", "2022-23", "2021-22"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={downloadReport} disabled={!reportData} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"><Download size={14} /> CSV</button>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading...</div>
      ) : reportData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Short Term Gains</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(reportData.summary?.total_short_term)}</p>
            </div>
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Long Term Gains</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(reportData.summary?.total_long_term)}</p>
            </div>
            <div className="border border-gray-100 p-4 rounded-lg bg-white shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Taxable</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.summary?.total_taxable_gain)}</p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 border-b border-gray-100">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr><th>Scheme</th><th>Buy Date</th><th>Sell Date</th><th className="text-right">Units</th><th className="text-right">Gain/Loss</th><th className="text-center">Type</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...(reportData.capital_gains?.short_term?.transactions || []).map(t => ({ ...t, type: 'ST' })), ...(reportData.capital_gains?.long_term?.transactions || []).map(t => ({ ...t, type: 'LT' }))].map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="font-medium text-gray-900 line-clamp-1 w-48">{t.scheme_name}</div></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.purchase_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.redemption_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{Number(t.units).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${t.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.gain_loss)}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] ${t.type === 'ST' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{t.type}</span></td>
                    </tr>
                  ))}
                  {(!reportData.capital_gains?.short_term?.transactions?.length && !reportData.capital_gains?.long_term?.transactions?.length) && (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No capital gains transactions found for this year.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
