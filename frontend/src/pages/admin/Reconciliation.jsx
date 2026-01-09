import { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Play,
} from "lucide-react";

export default function Reconciliation() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [reconciliationDate, setReconciliationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReconciliationTransactions();
  }, [page, reconciliationDate]);

  const fetchReconciliationTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        reconciliation_date: reconciliationDate,
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      const res = await fetchWithAuth(`/admin/reconciliation/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch reconciliation transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    try {
      const res = await fetchWithAuth("/admin/reconciliation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reconciliation_date: reconciliationDate,
        }),
      });
      if (res.ok) {
        await fetchReconciliationTransactions();
        alert("Reconciliation completed successfully");
      }
    } catch (err) {
      console.error("Failed to run reconciliation", err);
      alert("Failed to run reconciliation");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case "Matched":
        return "text-green-600 font-semibold";
      case "Pending":
        return "text-yellow-600 font-semibold";
      case "Discrepancy":
        return "text-red-600 font-semibold";
      default:
        return "";
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        tx.folio_number?.toLowerCase().includes(searchLower) ||
        tx.investor_name?.toLowerCase().includes(searchLower) ||
        tx.pan?.toLowerCase().includes(searchLower) ||
        tx.amc_name?.toLowerCase().includes(searchLower) ||
        tx.scheme_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalAMCAmount = filteredTransactions.reduce(
    (sum, tx) => sum + (tx.amc_amount || 0),
    0
  );
  const totalRTAAmount = filteredTransactions.reduce(
    (sum, tx) => sum + (tx.rta_amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reconciliation</h1>
        <p className="text-gray-600">
          Reconcile AMC reports with RTA processed transactions
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Reconciliation Date:
            </label>
            <input
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={runReconciliation}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Run Reconciliation
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchReconciliationTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Folio, Investor, PAN, AMC, Scheme"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Transaction ID",
                  "Folio Number",
                  "Investor Name",
                  "PAN",
                  "AMC Name",
                  "Scheme Name",
                  "Transaction Type",
                  "AMC Amount",
                  "RTA Amount",
                  "Units",
                  "NAV per Unit",
                  "Status",
                  "Remarks",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-8 text-center text-gray-500">
                    No reconciliation records found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.transaction_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.folio_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.investor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.pan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.amc_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.scheme_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.transaction_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(tx.amc_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(tx.rta_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.units.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{tx.nav_per_unit.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusClassName(tx.status)}`}>
                      {tx.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.remarks || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <div className="flex gap-6 flex-wrap">
          <p className="text-sm font-medium text-gray-900">
            Total Records: {filteredTransactions.length}
          </p>
          <p className="text-sm font-medium text-gray-900">
            Total AMC Amount: {formatCurrency(totalAMCAmount)}
          </p>
          <p className="text-sm font-medium text-gray-900">
            Total RTA Amount: {formatCurrency(totalRTAAmount)}
          </p>
          <p className="text-sm font-medium text-gray-900">
            Difference: {formatCurrency(totalAMCAmount - totalRTAAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
