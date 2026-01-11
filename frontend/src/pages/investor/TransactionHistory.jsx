import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { Search, Filter, Download, RefreshCw, X, ArrowUpRight, ArrowDownRight, Clock, FileText } from "lucide-react";

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
      setFilteredTransactions(txnList);
    } catch (err) {
      setError(err.message || "Failed to load transaction history");
      console.error("Transaction history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.transaction_id?.toLowerCase().includes(searchLower) ||
        t.scheme_name?.toLowerCase().includes(searchLower) ||
        t.scheme_id?.toLowerCase().includes(searchLower) ||
        t.folio_number?.toLowerCase().includes(searchLower)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((t) => {
        const type = t.transaction_type?.toLowerCase() || "";
        return type.includes(filterType.toLowerCase());
      });
    }

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
      "Scheme",
      "Folio Number",
      "Units",
      "NAV",
      "Amount",
      "Status",
      "Payment Mode"
    ];

    const rows = filteredTransactions.map((t) => [
      t.transaction_id || "",
      t.transaction_date || "",
      t.transaction_type || "",
      t.scheme_name || t.scheme_id || "",
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

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "completed") {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Completed</span>;
    }
    if (s === "pending") {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>;
    }
    if (s === "processing") {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">Processing</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">{status || "Failed"}</span>;
  };

  const getTypeIcon = (type) => {
    const t = type?.toLowerCase() || "";
    if (t.includes('redemption') || t.includes('swp') || t.includes('switch_redemption')) {
      return <ArrowUpRight className="w-4 h-4 text-orange-500" />;
    }
    return <ArrowDownRight className="w-4 h-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-1">Transaction History</h1>
          <p className="text-purple-100 text-lg opacity-90">
            Track and manage your investment activities
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, Scheme, or Folio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
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

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
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

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{transactions.length}</span> records
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheme / Folio</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t, index) => (
                    <tr key={t.transaction_id || index} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{t.transaction_id || "N/A"}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">ID</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {t.transaction_date
                            ? new Date(t.transaction_date).toLocaleDateString("en-IN", {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${t.transaction_type?.includes('redemption')
                              ? 'bg-orange-50'
                              : 'bg-green-50'
                            }`}>
                            {getTypeIcon(t.transaction_type)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {t.transaction_type?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{t.scheme_name || t.scheme_id || "Unknown Scheme"}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">{t.folio_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{Number(t.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.units ? `${Number(t.units).toFixed(3)} units` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(t.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                        <p className="text-gray-500 text-sm">
                          Try adjusting your search filters to find what you're looking for.
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
