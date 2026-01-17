import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Search, Download, RefreshCw, X, ArrowUpRight, ArrowDownRight, Clock, FileText, ArrowLeft } from "lucide-react";

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
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100 uppercase">Completed</span>;
    }
    if (s === "pending") {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100 uppercase">Pending</span>;
    }
    if (s === "processing") {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase">Processing</span>;
    }
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100 uppercase">{status || "Failed"}</span>;
  };

  const getTypeIcon = (type) => {
    const t = type?.toLowerCase() || "";
    if (t.includes('redemption') || t.includes('swp') || t.includes('switch_redemption')) {
      return <ArrowUpRight className="w-3 h-3 text-orange-500" />;
    }
    return <ArrowDownRight className="w-3 h-3 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 w-full">
      {/* Simple Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-500 text-sm">Track your investment activities.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filters Card - Compact */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="redemption">Redemption</option>
              <option value="sip">SIP</option>
              <option value="swp">SWP</option>
              <option value="stp">STP</option>
              <option value="switch">Switch</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto w-full md:w-auto justify-end">
            <button
              onClick={fetchTransactions}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table - Compact */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Scheme</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, index) => (
                  <tr key={t.transaction_id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1 rounded-full ${t.transaction_type?.includes('redemption') ? 'bg-orange-50' : 'bg-green-50'}`}>
                          {getTypeIcon(t.transaction_type)}
                        </div>
                        <span className="font-medium text-gray-700 capitalize text-xs">{(t.transaction_type || "").replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 truncate max-w-[240px]" title={t.scheme_name}>{t.scheme_name || t.scheme_id || "Unknown Scheme"}</span>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5">fol: {t.folio_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="font-bold text-gray-900">₹{Number(t.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-gray-500">{t.units ? `${Number(t.units).toFixed(3)} units` : '-'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {getStatusBadge(t.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-6 h-6 text-gray-300" />
                      <span className="text-xs">No transactions match your filters.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Simple Footer/Pagination info if needed */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
        </div>
      </div>
    </div>
  );
}
