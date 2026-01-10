import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Wallet, TrendingUp, TrendingDown, ArrowRight, RefreshCw, PlusCircle, DollarSign, Repeat } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name || "Investor"}!
          </h1>
          <p className="text-blue-100 text-lg">
            Here's a quick snapshot of your portfolio today.
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Total Investment</h3>
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              ₹{summary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Current Value</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              ₹{summary.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${summary.gainLoss >= 0 ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Gain / Loss</h3>
              {summary.gainLoss >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className={`text-3xl font-bold ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.gainLoss >= 0 ? '+' : ''}₹{Math.abs(summary.gainLoss).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm mt-1 ${summary.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.gainLossPercentage >= 0 ? '+' : ''}{summary.gainLossPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate("/purchase")}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-500 group"
          >
            <div className="flex items-center justify-between mb-2">
              <PlusCircle className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800">Purchase</p>
          </button>

          <button
            onClick={() => navigate("/redemption")}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200 hover:border-orange-500 group"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
            </div>
            <p className="font-semibold text-gray-800">Redemption</p>
          </button>

          <button
            onClick={() => navigate("/sip")}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200 hover:border-green-500 group"
          >
            <div className="flex items-center justify-between mb-2">
              <Repeat className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">SIP Setup</p>
          </button>

          <button
            onClick={() => navigate("/transactions")}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200 hover:border-purple-500 group"
          >
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
            </div>
            <p className="font-semibold text-gray-800">Transactions</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Holdings Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Your Holdings</h2>
              <span className="text-sm text-gray-600">{summary.folioCount} {summary.folioCount === 1 ? 'Folio' : 'Folios'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">NAV</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.length > 0 ? (
                    holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{h.scheme_name || h.scheme_id}</p>
                            <p className="text-xs text-gray-500">{h.scheme_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/folio/${h.folio_number}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {h.folio_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {Number(h.total_units || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ₹{Number(h.current_nav || h.last_nav || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          ₹{Number(h.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No holdings found. Start by making a purchase.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
              <Link
                to="/transactions"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6">
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-900">{t.transaction_type || 'Transaction'}</p>
                        <p className="text-sm text-gray-500">{t.scheme_id}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₹{Number(t.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent transactions found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Active SIPs */}
        {sips.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Active SIPs</h2>
              <Link
                to="/sip"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Manage <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Installment</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sips.map((sip, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sip.scheme_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{Number(sip.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{sip.frequency || 'Monthly'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sip.next_installment_date ? new Date(sip.next_installment_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
