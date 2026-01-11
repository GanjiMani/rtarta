import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  DollarSign,
  Repeat,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock
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
  const [sips, setSips] = useState([]);
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
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      const dashboardData = data.data || {};

      // Set portfolio summary
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

      // Set holdings
      setHoldings(dashboardData.portfolio || []);

      // Set recent transactions
      setTransactions(dashboardData.recent_transactions || []);

      // Set active SIPs
      setSips(dashboardData.active_sips || []);

    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAssetClassBadge = (type) => {
    const t = type?.toLowerCase() || "";
    if (t === "equity") return "bg-blue-50 text-blue-700 border-blue-200";
    if (t === "debt") return "bg-green-50 text-green-700 border-green-200";
    if (t === "hybrid") return "bg-purple-50 text-purple-700 border-purple-200";
    if (t === "commodity") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-blue-700 to-blue-600 text-white pb-24 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Welcome back, {user?.full_name || "Investor"}
              </h1>
              <p className="text-blue-100 text-lg opacity-90">
                Here's your portfolio performance overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/analytics/allocation")}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all border border-white/20"
              >
                <PieChart className="w-4 h-4" />
                <span>Asset Allocation</span>
              </button>
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Value Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Live</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Current Value</p>
              <h3 className="text-3xl font-bold text-gray-900">
                ₹{summary.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Total Investment Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Invested</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Investment</p>
              <h3 className="text-3xl font-bold text-gray-900">
                ₹{summary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          {/* Gain/Loss Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${summary.gainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {summary.gainLoss >= 0 ? (
                  <TrendingUp className={`w-6 h-6 ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <span className={`text-sm font-bold px-2 py-1 rounded-md ${summary.gainLoss >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {summary.gainLossPercentage >= 0 ? '+' : ''}{summary.gainLossPercentage.toFixed(2)}%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Gain/Loss</p>
              <h3 className={`text-3xl font-bold ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.gainLoss >= 0 ? '+' : ''}₹{Math.abs(summary.gainLoss).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate("/purchase")}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="p-3 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
              <PlusCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-blue-700">Invest</span>
          </button>

          <button
            onClick={() => navigate("/redemption")}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-500 hover:bg-orange-50 transition-all group"
          >
            <div className="p-3 bg-orange-100 rounded-full mb-2 group-hover:bg-orange-200 transition-colors">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-orange-700">Redeem</span>
          </button>

          <button
            onClick={() => navigate("/sip")}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="p-3 bg-green-100 rounded-full mb-2 group-hover:bg-green-200 transition-colors">
              <Repeat className="w-6 h-6 text-green-600" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-green-700">SIP</span>
          </button>

          <button
            onClick={() => navigate("/transactions")}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="p-3 bg-purple-100 rounded-full mb-2 group-hover:bg-purple-200 transition-colors">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-purple-700">History</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Holdings Section (Mac-bento style, spans 2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">Your Portfolio</h2>
              </div>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {summary.folioCount} {summary.folioCount === 1 ? 'Holding' : 'Holdings'}
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheme</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invested</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Returns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {holdings.length > 0 ? (
                    holdings.map((h, i) => {
                      const gain = (h.total_value || 0) - (h.total_investment || 0);
                      const gainPercent = h.total_investment > 0 ? (gain / h.total_investment) * 100 : 0;

                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900 mb-1">{h.scheme_name || h.scheme_id}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getAssetClassBadge(h.scheme_type)}`}>
                                  {h.scheme_type || "MF"}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">{h.folio_number}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 font-medium">
                              ₹{Number(h.total_investment || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {Number(h.total_units || 0).toFixed(2)} units
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              ₹{Number(h.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-xs text-gray-400">
                              NAV: {Number(h.current_nav || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center justify-end gap-1`}>
                              {gain >= 0 ? '+' : ''}₹{Math.abs(gain).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <div className={`text-xs font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <PlusCircle className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="font-medium">No investments yet</p>
                          <p className="text-sm mt-1">Start your journey by making a purchase</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Recent Transactions & SIPs */}
          <div className="flex flex-col gap-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                <Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              </div>
              <div className="p-0">
                {transactions.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {transactions.slice(0, 5).map((t, i) => (
                      <div key={i} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {t.transaction_type?.replace(/_/g, " ")}
                          </span>
                          <span className={`text-sm font-bold ${t.transaction_type?.includes('purchase') ? 'text-gray-900' :
                              t.transaction_type?.includes('redemption') ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                            {t.transaction_type?.includes('redemption') ? '-' : '+'}
                            ₹{Number(t.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-100 text-green-700' :
                              t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>

            {/* Active SIPs Teaser */}
            {sips.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Repeat className="w-5 h-5 text-indigo-200" />
                    <h3 className="font-bold">Active SIPs</h3>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold">{sips.length}</span>
                    <span className="text-indigo-200 mb-1.5 text-sm">running</span>
                  </div>
                  <p className="text-indigo-100 text-sm mb-4">
                    Total committed: ₹{sips.reduce((sum, sip) => sum + (sip.amount || 0), 0).toLocaleString('en-IN')} / month
                  </p>
                  <button
                    onClick={() => navigate("/sip")}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Manage SIPs
                  </button>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
