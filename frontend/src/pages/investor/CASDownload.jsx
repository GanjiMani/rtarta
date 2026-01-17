import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Printer, Calendar } from "lucide-react";

export default function CASDownload() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [year, setYear] = useState(() => {
    const d = new Date();
    const cY = d.getFullYear();
    const cM = d.getMonth() + 1;
    return cM <= 3 ? `${cY - 1}-${String(cY).slice(-2)}` : `${cY}-${String(cY + 1).slice(-2)}`;
  });

  const handleDownload = async (format = 'csv') => {
    setError(""); setSuccessMsg(""); setLoading(true);
    try {
      const [startYear, endYearSuffix] = year.split('-');
      const endYear = 2000 + parseInt(endYearSuffix);
      const fromDate = `${startYear}-04-01`; const toDate = `${endYear}-03-31`;

      const response = await fetchWithAuth(`/api/investor/reports/cas?from_date=${fromDate}&to_date=${toDate}`);
      if (!response.ok) throw new Error("Failed");
      const result = await response.json();

      if (format === 'csv') {
        generateAndDownloadCSV(result.data, year);
        setSuccessMsg(`CAS (CSV) generated for FY ${year}!`);
      } else if (format === 'print') {
        handlePrint(result.data, year);
      }
    } catch (err) { setError("Failed to generate CAS"); } finally { setLoading(false); }
  };

  const generateAndDownloadCSV = (casData, financialYear) => {
    let rows = [["CONSOLIDATED ACCOUNT STATEMENT", `FY ${financialYear}`], []];
    if (casData.investor_info) rows.push(["Name", casData.investor_info.name], ["Email", casData.investor_info.email], ["PAN", casData.investor_info.pan], []);

    if (casData.schemes) {
      casData.schemes.forEach((s) => {
        rows.push([`SCHEME: ${s.scheme_name}`]);
        rows.push(["Folio", s.folio_number, "AMC", s.amc_name]);
        rows.push(["Current Units", s.current_holdings?.units, "Value", s.current_holdings?.value]);
        rows.push(["Date", "Trx ID", "Type", "Amount", "Units", "NAV"]);
        s.transactions?.forEach(t => rows.push([t.date, t.transaction_id, t.type, t.amount, t.units, t.nav]));
        rows.push([]);
      });
    }

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.download = `CAS_${financialYear}.csv`;
    link.click();
  };

  const handlePrint = (casData, financialYear) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>CAS FY ${financialYear}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2}.scheme{margin-top:20px;border:1px solid #eee;padding:10px}</style></head><body><h1>CAS - FY ${financialYear}</h1>
      <p>Name: ${casData.investor_info?.name}</p><p>PAN: ${casData.investor_info?.pan}</p>
      ${casData.schemes?.map(s => `<div class="scheme"><h3>${s.scheme_name}</h3><p>Folio: ${s.folio_number} | Value: ${s.current_holdings?.value}</p>
      <table><thead><tr><th>Date</th><th>Type</th><th>Amt</th><th>Units</th><th>NAV</th></tr></thead><tbody>
      ${s.transactions?.map(t => `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.amount}</td><td>${t.units}</td><td>${t.nav}</td></tr>`).join('')}
      </tbody></table></div>`).join('')}</body></html>`);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-8 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consolidated Account Statement</h1>
          <p className="text-gray-500 text-sm">Download your complete investment history.</p>
        </div>
      </div>

      {successMsg && <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      <div className="max-w-2xl border border-gray-100 rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Calendar size={16} /> Select Financial Year</label>
            <div className="grid grid-cols-3 gap-3">
              {["2025-26", "2024-25", "2023-24", "2022-23", "2021-22", "2020-21"].map((fy) => (
                <button key={fy} onClick={() => setYear(fy)} className={`py-2 px-3 rounded border text-sm transition-all ${year === fy ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{fy}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => handleDownload('csv')} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} Download CSV
            </button>
            <button onClick={() => handleDownload('print')} disabled={loading} className="flex-1 py-2 border border-blue-200 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-50 disabled:opacity-50 flex justify-center items-center gap-2">
              <Printer size={16} /> Print View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
