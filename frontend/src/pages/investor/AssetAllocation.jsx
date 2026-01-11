import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  TrendingUp,
  Briefcase,
  Activity,
  AlertCircle
} from "lucide-react";

// Professional color palette matching the theme
const COLORS = [
  "#2563EB", // Blue-600
  "#059669", // Emerald-600
  "#D97706", // Amber-600
  "#DC2626", // Red-600
  "#7C3AED", // Violet-600
  "#DB2777", // Pink-600
  "#0891B2"  // Cyan-600
];

export default function AssetAllocation() {
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allocationData, setAllocationData] = useState({
    bySchemeType: [],
    byAMC: [],
    totalValue: 0,
    totalInvestment: 0,
    gainLoss: 0,
    gainLossPercent: 0
  });

  useEffect(() => {
    fetchAllocationData();
  }, [fetchWithAuth]);

  const fetchAllocationData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch folios to calculate allocation
      const foliosRes = await fetchWithAuth("/api/investor/folios");
      if (!foliosRes.ok) {
        throw new Error("Failed to fetch portfolio data");
      }
      const foliosData = await foliosRes.json();

      // Robust data handling
      let folios = [];
      if (Array.isArray(foliosData.data)) {
        folios = foliosData.data;
      } else if (Array.isArray(foliosData)) {
        folios = foliosData;
      } else if (foliosData && Array.isArray(foliosData.folios)) {
        folios = foliosData.folios;
      }

      if (!Array.isArray(folios) || folios.length === 0) {
        setLoading(false);
        return; // States remain default empty
      }

      // Calculate allocation logic
      const schemeTypeMap = {};
      const amcMap = {};
      let totalValue = 0;
      let totalInvestment = 0;

      folios.forEach(folio => {
        // Use fallbacks for safety
        const value = parseFloat(folio.total_value || folio.current_value || 0);
        const investment = parseFloat(folio.total_investment || 0);

        // Normalize scheme type (capitalize first letter)
        let schemeType = folio.scheme_type || "Other";
        if (schemeType !== "Other") {
          schemeType = schemeType.charAt(0).toUpperCase() + schemeType.slice(1);
        }

        // Get AMC Name - prefer name, fallback to ID
        const amcName = folio.amc_name || folio.amc_id || "Unknown AMC";

        totalValue += value;
        totalInvestment += investment;

        // Group by scheme type
        if (!schemeTypeMap[schemeType]) {
          schemeTypeMap[schemeType] = { name: schemeType, value: 0, investment: 0, count: 0 };
        }
        schemeTypeMap[schemeType].value += value;
        schemeTypeMap[schemeType].investment += investment;
        schemeTypeMap[schemeType].count += 1;

        // Group by AMC
        if (!amcMap[amcName]) {
          amcMap[amcName] = { name: amcName, value: 0, investment: 0, count: 0 };
        }
        amcMap[amcName].value += value;
        amcMap[amcName].investment += investment;
        amcMap[amcName].count += 1;
      });

      // Transform maps to sorted arrays
      const bySchemeType = Object.values(schemeTypeMap)
        .map(item => ({
          ...item,
          percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : 0,
          gainLoss: item.value - item.investment,
          gainLossPercent: item.investment > 0 ? (((item.value - item.investment) / item.investment) * 100).toFixed(2) : 0
        }))
        .sort((a, b) => b.value - a.value);

      const byAMC = Object.values(amcMap)
        .map(item => ({
          ...item,
          percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : 0,
          gainLoss: item.value - item.investment,
          gainLossPercent: item.investment > 0 ? (((item.value - item.investment) / item.investment) * 100).toFixed(2) : 0
        }))
        .sort((a, b) => b.value - a.value);

      const gainLoss = totalValue - totalInvestment;
      const gainLossPercent = totalInvestment > 0 ? ((gainLoss / totalInvestment) * 100) : 0;

      setAllocationData({
        bySchemeType,
        byAMC,
        totalValue,
        totalInvestment,
        gainLoss,
        gainLossPercent: gainLossPercent.toFixed(2)
      });

    } catch (err) {
      console.error("Error fetching allocation data:", err);
      setError(err.message || "Failed to load asset allocation data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom Chart Components
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border border-blue-100 rounded-xl shadow-xl">
          <p className="font-bold text-gray-900 mb-1">{data.name}</p>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-500">Value:</span>
            <span className="font-semibold text-blue-600">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm mt-1">
            <span className="text-gray-500">Portion:</span>
            <span className="font-semibold text-gray-900">{data.payload.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? ( // Only show label if > 5%
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Analyzing portfolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold">Portfolio Analysis</h1>
          </div>
          <p className="text-blue-100 max-w-2xl ml-11">
            Visual breakdown of your investments across asset classes and fund houses.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transform hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Current Value</span>
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(allocationData.totalValue)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500 transform hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Invested Amount</span>
              <PieChartIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(allocationData.totalInvestment)}</div>
          </div>

          <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 transform hover:scale-[1.02] transition-transform duration-200 ${allocationData.gainLoss >= 0 ? "border-green-500" : "border-red-500"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total P&L</span>
              <TrendingUp className={`w-5 h-5 ${allocationData.gainLoss >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
            <div className={`text-2xl font-bold ${allocationData.gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {allocationData.gainLoss >= 0 ? '+' : ''}{formatCurrency(allocationData.gainLoss)}
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 transform hover:scale-[1.02] transition-transform duration-200 ${parseFloat(allocationData.gainLossPercent) >= 0 ? "border-yellow-500" : "border-red-500"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">XIRR (Approx)</span>
              <Activity className="w-5 h-5 text-yellow-500" />
            </div>
            <div className={`text-2xl font-bold ${parseFloat(allocationData.gainLossPercent) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {allocationData.gainLossPercent}%
            </div>
          </div>
        </div>

        {allocationData.bySchemeType.length === 0 && !error ? (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center border border-gray-100">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <PieChartIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Portfolio is Empty</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Start investing in recommended schemes to see your asset allocation breakdown and performace analysis.</p>
            <button
              onClick={() => navigate("/purchase")}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              Start Investing
            </button>
          </div>
        ) : (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Asset Allocation Chart */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Asset Class Allocation</h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData.bySchemeType}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                        label={renderCustomLabel}
                        labelLine={false}
                      >
                        {allocationData.bySchemeType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AMC Allocation Chart */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">AMC Exposure</h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData.byAMC}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                        label={renderCustomLabel}
                        labelLine={false}
                      >
                        {allocationData.byAMC.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Asset Class Table */}
              <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800">Asset Class Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="pl-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Current Value</th>
                        <th className="pr-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Alloc %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allocationData.bySchemeType.map((item, index) => (
                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                          <td className="pl-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="pr-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AMC Table */}
              <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800">AMC Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="pl-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fund House</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Current Value</th>
                        <th className="pr-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Alloc %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allocationData.byAMC.map((item, index) => (
                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                          <td className="pl-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="pr-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
