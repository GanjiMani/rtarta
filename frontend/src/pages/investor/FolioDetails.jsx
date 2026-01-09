import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

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
    
    // Validate that id is a valid folio_number format (should not be just numeric, e.g., "1")
    // Folio numbers are like "F001", "F002", etc.
    if (/^\d+$/.test(id)) {
      setError(`Invalid folio number format. Folio numbers should be like "F001", "F002", etc. Please access folio details from the Dashboard by clicking on a folio number.`);
      setLoading(false);
      return;
    }
    
    async function fetchFolioData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch folio details - id should be folio_number (e.g., "F001")
        const folioRes = await fetchWithAuth(`/api/investor/folios/${id}`);
        if (!folioRes.ok) {
          if (folioRes.status === 404) {
            throw new Error(`Folio "${id}" not found. Please check the folio number and try again.`);
          }
          if (folioRes.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          const errText = await folioRes.text();
          throw new Error(`Failed to fetch folio: ${folioRes.status} ${errText}`);
        }
        const folioResult = await folioRes.json();
        const folio = folioResult.data || folioResult;
        setFolioData(folio);
        
        // Fetch holdings
        const holdingsRes = await fetchWithAuth(`/api/investor/folios/${id}/holdings`);
        if (holdingsRes.ok) {
          const holdingsResult = await holdingsRes.json();
          setHoldings(holdingsResult.data ? [holdingsResult.data] : []);
        }

        // Fetch transactions
        const txnsRes = await fetchWithAuth(`/api/investor/folios/${id}/transactions`);
        if (txnsRes.ok) {
          const txnsResult = await txnsRes.json();
          setTransactions(Array.isArray(txnsResult.data) ? txnsResult.data : []);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching folio data:", err);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading folio details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
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
          <div className="bg-white shadow-lg rounded-xl p-6 text-center">
            <Link
              to="/dashboard"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!folioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">Folio Not Found</h3>
            <p className="mt-2 text-sm text-gray-500">The requested folio could not be found.</p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Folio Details</h1>
          <p className="text-gray-600">Detailed information for folio {folioData.folio_number || id}</p>
        </div>

        {/* Folio Summary Card */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Folio Number</label>
              <p className="mt-1 text-xl font-bold text-gray-900">{folioData.folio_number || id}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Scheme</label>
              <p className="mt-1 text-lg text-gray-900">{folioData.scheme_name || folioData.scheme_id || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <p className="mt-1">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  (folioData.status === "active" || folioData.status === "Active")
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {folioData.status || "Unknown"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Units</label>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {parseFloat(folioData.total_units || 0).toFixed(4)}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Investment</label>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCurrency(parseFloat(folioData.total_investment || 0))}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Current Value</label>
              <p className="mt-1 text-xl font-bold text-blue-600">
                {formatCurrency(parseFloat(folioData.total_value || folioData.current_value || 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {["holdings", "transactions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "holdings" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Holdings Summary</h3>
                {holdings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No holdings data available for this folio.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Investment</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {holdings.map((h, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {h.folio_number || folioData.folio_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {parseFloat(h.total_units || 0).toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(parseFloat(h.total_investment || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                              {formatCurrency(parseFloat(h.total_value || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h3>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No transactions found for this folio.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">NAV</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((t) => (
                          <tr key={t.transaction_id || t.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {t.transaction_id || t.txn_id || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(t.transaction_date || t.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(t.transaction_type || t.txn_type || "N/A").replace(/_/g, " ")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {t.units ? parseFloat(t.units).toFixed(4) : "0.0000"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {t.nav_per_unit || t.nav ? formatCurrency(parseFloat(t.nav_per_unit || t.nav)) : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                              {formatCurrency(parseFloat(t.amount || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (t.status === "completed" || t.status === "Completed")
                                  ? "bg-green-100 text-green-800"
                                  : (t.status === "pending" || t.status === "Pending")
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {t.status || "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
