import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../services/AuthContext";
import { Search, Filter, Download, RefreshCw, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function TransactionHistory() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState("");
  const [limit] = useState(50);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchTransactions();
    }
  }, [fetchWithAuth, limit]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filterType, filterStatus]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth(`/api/investor/transactions/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      const txnList = data.data?.transactions || [];
      setTransactions(txnList);
      setFilteredTransactions(txnList); // Initialize filtered list
    } catch (err) {
      setError(err.message || "Failed to load transaction history");
      console.error("Transaction history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.transaction_id?.toLowerCase().includes(searchLower) ||
        t.scheme_id?.toLowerCase().includes(searchLower) ||
        t.folio_number?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((t) => {
        const type = t.transaction_type?.toLowerCase() || "";
        return type.includes(filterType.toLowerCase());
      });
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => {
        const status = t.status?.toLowerCase() || "";
        return status === filterStatus.toLowerCase();
      });
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "Scheme ID",
      "Folio Number",
      "Units",
      "NAV per Unit",
      "Amount",
      "Status",
      "Payment Mode"
    ];

    const rows = filteredTransactions.map((t) => [
      t.transaction_id || "",
      t.transaction_date || "",
      t.transaction_type || "",
      t.scheme_id || "",
      t.folio_number || "",
      t.units || 0,
      t.nav_per_unit || 0,
      t.amount || 0,
      t.status || "",
      t.payment_mode || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "completed") {
      return "bg-green-100 text-green-800";
    } else if (statusLower === "pending") {
      return "bg-yellow-100 text-yellow-800";
    } else if (statusLower === "failed" || statusLower === "rejected") {
      return "bg-red-100 text-red-800";
    } else if (statusLower === "processing") {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getTypeBadgeClass = (type) => {
    const typeLower = type?.toLowerCase() || "";
    if (typeLower.includes("purchase") || typeLower.includes("sip")) {
      return "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (typeLower.includes("redemption") || typeLower.includes("swp")) {
      return "bg-orange-50 text-orange-700 border border-orange-200";
    } else if (typeLower.includes("switch") || typeLower.includes("stp")) {
      return "bg-purple-50 text-purple-700 border border-purple-200";
    }
    return "bg-gray-50 text-gray-700 border border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-purple-100 text-lg">
            View and manage all your investment transactions
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Transaction ID, Scheme, or Folio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="redemption">Redemption</option>
                <option value="sip">SIP</option>
                <option value="swp">SWP</option>
                <option value="stp">STP</option>
                <option value="switch">Switch</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredTransactions.length}</span> of{" "}
              <span className="font-semibold">{transactions.length}</span> transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAV/Unit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Mode
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t, index) => (
                    <tr key={t.transaction_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{t.transaction_id || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {t.transaction_date
                            ? new Date(t.transaction_date).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(
                            t.transaction_type
                          )}`}
                        >
                          {t.transaction_type || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{t.scheme_id || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{t.folio_number || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {t.units != null ? Number(t.units).toFixed(4) : "0.0000"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ₹{t.nav_per_unit != null ? Number(t.nav_per_unit).toFixed(4) : "0.0000"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        ₹{Number(t.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            t.status
                          )}`}
                        >
                          {t.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">{t.payment_mode || "N/A"}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No transactions found</p>
                        <p className="text-sm mt-2">
                          {searchTerm || filterType !== "all" || filterStatus !== "all"
                            ? "Try adjusting your filters"
                            : "Your transaction history will appear here"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
