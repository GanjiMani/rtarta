import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function FolioDetails() {
  const { id } = useParams();
  const { fetchWithAuth } = useAuth();

  const [folioData, setFolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("holdings");
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No folio number provided");
      return;
    }

    if (!fetchWithAuth) {
      setLoading(false);
      return;
    }

    if (/^\d+$/.test(id)) {
      setError(`Invalid folio number format. Folio numbers should be like "F001", "F002", etc. Please access folio details from the Dashboard by clicking on a folio number.`);
      setLoading(false);
      return;
    }

    async function fetchFolioData() {
      setLoading(true);
      setError(null);
      try {
        const folioRes = await fetchWithAuth(`/api/investor/folios/${id}`);
        if (!folioRes.ok) {
          if (folioRes.status === 404) {
            throw new Error(`Folio "${id}" not found.`);
          }
          const errText = await folioRes.text();
          throw new Error(`Failed to fetch folio: ${folioRes.status} ${errText}`);
        }
        const folioResult = await folioRes.json();
        const folio = folioResult.data || folioResult;
        setFolioData(folio);

        const holdingsRes = await fetchWithAuth(`/api/investor/folios/${id}/holdings`);
        if (holdingsRes.ok) {
          const holdingsResult = await holdingsRes.json();
          setHoldings(holdingsResult.data ? [holdingsResult.data] : []);
        }

        const txnsRes = await fetchWithAuth(`/api/investor/folios/${id}/transactions`);
        if (txnsRes.ok) {
          const txnsResult = await txnsRes.json();
          setTransactions(Array.isArray(txnsResult.data) ? txnsResult.data : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFolioData();
  }, [id, fetchWithAuth]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-6 text-red-700">
          {error}
        </div>
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!folioData) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="text-gray-900 font-bold text-lg mb-4">Folio Not Found</div>
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folio Details</h1>
          <p className="text-gray-500 text-sm">{folioData.folio_number || id}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Scheme</p>
          <p className="text-lg font-bold text-gray-900">{folioData.scheme_name || folioData.scheme_id || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
          <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase rounded ${(folioData.status === "active" || folioData.status === "Active")
              ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
            {folioData.status || "Unknown"}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Units</p>
          <p className="text-lg font-bold text-gray-900">{parseFloat(folioData.total_units || 0).toFixed(4)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Current Value</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(parseFloat(folioData.total_value || folioData.current_value || 0))}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 mb-6">
        <div className="flex gap-6">
          {["holdings", "transactions"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "holdings" && (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Folio</th>
                <th className="px-6 py-3 text-right">Units</th>
                <th className="px-6 py-3 text-right">Investment</th>
                <th className="px-6 py-3 text-right">Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holdings.length > 0 ? holdings.map((h, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium text-gray-900">{h.folio_number || folioData.folio_number}</td>
                  <td className="px-6 py-4 text-right">{parseFloat(h.total_units || 0).toFixed(4)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(parseFloat(h.total_investment || 0))}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(parseFloat(h.total_value || 0))}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No holdings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">NAV</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? transactions.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{formatDate(t.transaction_date || t.date)}</td>
                  <td className="px-6 py-4 capitalize">{(t.transaction_type || t.txn_type || "").replace(/_/g, " ")}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(parseFloat(t.amount || 0))}</td>
                  <td className="px-6 py-4 text-right">{t.nav_per_unit || t.nav ? formatCurrency(parseFloat(t.nav_per_unit || t.nav)) : "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${(t.status === "completed" || t.status === "Completed") ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{t.status || "Pending"}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
