import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PlusCircle,
  DollarSign,
  Repeat,
  PieChart,
  Activity,
  Clock,
  ArrowRight
} from "lucide-react";

export default function Dashboard() {
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalInvestment: 0,
    currentValue: 0,
    gainLoss: 0,
    gainLossPercentage: 0,
    folioCount: 0
  });
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fetchWithAuth) {
      fetchDashboardData();
    }
  }, [fetchWithAuth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      const dashboardData = data.data || {};

      if (dashboardData.portfolio_summary) {
        setSummary({
          totalInvestment: dashboardData.portfolio_summary.total_investment || 0,
          currentValue: dashboardData.portfolio_summary.current_value || 0,
          gainLoss: dashboardData.portfolio_summary.gain_loss || 0,
          gainLossPercentage: dashboardData.portfolio_summary.total_investment > 0
            ? ((dashboardData.portfolio_summary.current_value - dashboardData.portfolio_summary.total_investment) / dashboardData.portfolio_summary.total_investment) * 100
            : 0,
          folioCount: dashboardData.portfolio_summary.folio_count || 0
        });
      }
      setHoldings(dashboardData.portfolio || []);
      setTransactions(dashboardData.recent_transactions || []);

    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getAssetClassBadge = (type) => {
    const t = type?.toLowerCase() || "";
    if (t === "equity") return "bg-blue-50 text-blue-700 border-blue-100";
    if (t === "debt") return "bg-green-50 text-green-700 border-green-100";
    return "bg-gray-50 text-gray-700 border-gray-100";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Compact Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Overview</h1>
          <p className="text-xs text-gray-500">Welcome, {user?.full_name || "Investor"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/analytics/allocation")} className="text-xs flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50 text-gray-600">
            <PieChart size={14} /> Allocation
          </button>
          <button onClick={fetchDashboardData} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</div>}

      {/* Summary Cards - Grid with reduced gaps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">Current Value</p>
            <Wallet size={16} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            ₹{summary.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </h3>
        </div>

        <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">Invested Amount</p>
            <Activity size={16} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            ₹{summary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </h3>
        </div>

        <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">Total Returns</p>
            {summary.gainLoss >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
          </div>
          <h3 className={`text-xl font-bold ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.gainLoss >= 0 ? '+' : ''}₹{Math.abs(summary.gainLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </h3>
          <p className={`text-xs mt-1 font-medium ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.gainLossPercentage >= 0 ? '+' : ''}{summary.gainLossPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button onClick={() => navigate("/purchase")} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <PlusCircle size={18} className="text-blue-600" /> <span className="text-xs font-medium">Invest</span>
        </button>
        <button onClick={() => navigate("/redemption")} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <DollarSign size={18} className="text-orange-500" /> <span className="text-xs font-medium">Redeem</span>
        </button>
        <button onClick={() => navigate("/sip")} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <Repeat size={18} className="text-green-500" /> <span className="text-xs font-medium">SIPs</span>
        </button>
        <button onClick={() => navigate("/transactions")} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <Clock size={18} className="text-purple-500" /> <span className="text-xs font-medium">History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings */}
        <div className="lg:col-span-2 border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900">Holdings</h3>
            <span className="text-[10px] bg-white border px-2 py-0.5 rounded text-gray-500">{summary.folioCount} Schemes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                <tr>
                  <th className="px-4 py-2">Scheme</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {holdings.length > 0 ? (
                  holdings.slice(0, 5).map((h, i) => { // Limit to 5 for overview
                    const gain = (h.total_value || 0) - (h.total_investment || 0);
                    const gainPercent = h.total_investment > 0 ? (gain / h.total_investment) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/folio/${h.folio_number}`)}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{h.scheme_name || h.scheme_id}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1 rounded border uppercase ${getAssetClassBadge(h.scheme_type)}`}>{h.scheme_type || "MF"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">₹{Number(h.total_value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className={`px-4 py-3 text-right font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gainPercent.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400 text-xs">No holdings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {holdings.length > 5 && (
            <div className="p-2 text-center border-t border-gray-100">
              <button className="text-xs text-blue-600 font-medium hover:underline">View All</button>
            </div>
          )}
        </div>

        {/* Recent Transactions - Compact List */}
        <div className="border border-gray-100 rounded-lg shadow-sm overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            <Link to="/transactions" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((t, i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 capitalize main-font">{(t.transaction_type || "").replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-gray-500">{new Date(t.transaction_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">₹{Number(t.amount).toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] capitalize ${t.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>{t.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-xs">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
