import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function AssetAllocation() {
  const { fetchWithAuth } = useAuth();
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
      // Handle different response structures
      let folios = [];
      if (Array.isArray(foliosData.data)) {
        folios = foliosData.data;
      } else if (Array.isArray(foliosData)) {
        folios = foliosData;
      } else if (foliosData && Array.isArray(foliosData.folios)) {
        folios = foliosData.folios;
      }

      if (!Array.isArray(folios) || folios.length === 0) {
        setAllocationData({
          bySchemeType: [],
          byAMC: [],
          totalValue: 0,
          totalInvestment: 0,
          gainLoss: 0,
          gainLossPercent: 0
        });
        setLoading(false);
        return;
      }

      // Calculate allocation by scheme type
      const schemeTypeMap = {};
      const amcMap = {};
      let totalValue = 0;
      let totalInvestment = 0;

      folios.forEach(folio => {
        const value = parseFloat(folio.total_value || folio.current_value || 0);
        const investment = parseFloat(folio.total_investment || 0);
        const schemeType = folio.scheme_type || "Other";
        // AMC name might not be in the folio response, use AMC ID as fallback
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

      // Convert to arrays and calculate percentages
      const bySchemeType = Object.values(schemeTypeMap).map(item => ({
        ...item,
        percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : 0,
        gainLoss: item.value - item.investment,
        gainLossPercent: item.investment > 0 ? (((item.value - item.investment) / item.investment) * 100).toFixed(2) : 0
      })).sort((a, b) => b.value - a.value);

      const byAMC = Object.values(amcMap).map(item => ({
        ...item,
        percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : 0,
        gainLoss: item.value - item.investment,
        gainLossPercent: item.investment > 0 ? (((item.value - item.investment) / item.investment) * 100).toFixed(2) : 0
      })).sort((a, b) => b.value - a.value);

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-blue-600 font-medium">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-600">{data.payload.percentage}% of portfolio</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading asset allocation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Allocation</h1>
          <p className="text-gray-600">View your portfolio distribution across different asset classes and AMCs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(allocationData.totalValue)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Investment</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(allocationData.totalInvestment)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Gain/Loss</div>
            <div className={`text-2xl font-bold ${allocationData.gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(allocationData.gainLoss)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Return %</div>
            <div className={`text-2xl font-bold ${parseFloat(allocationData.gainLossPercent) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {allocationData.gainLossPercent}%
            </div>
          </div>
        </div>

        {allocationData.bySchemeType.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data</h3>
            <p className="text-gray-500 mb-6">Start investing to see your asset allocation breakdown</p>
            <a
              href="/purchase"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Make Your First Investment
            </a>
          </div>
        ) : (
          <>
            {/* Allocation by Scheme Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Allocation by Asset Class</h2>
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
                        label={<CustomLabel />}
                        labelLine={false}
                      >
                        {allocationData.bySchemeType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Allocation by AMC</h2>
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
                        label={<CustomLabel />}
                        labelLine={false}
                      >
                        {allocationData.byAMC.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Scheme Type Breakdown */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                  <h2 className="text-xl font-bold text-white">Asset Class Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Asset Class</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Allocation %</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allocationData.bySchemeType.map((item, index) => (
                        <tr key={item.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                            {item.percentage}%
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                            parseFloat(item.gainLoss) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatCurrency(item.gainLoss)} ({item.gainLossPercent}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AMC Breakdown */}
              <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
                  <h2 className="text-xl font-bold text-white">AMC Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">AMC Name</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Allocation %</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allocationData.byAMC.map((item, index) => (
                        <tr key={item.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                            {item.percentage}%
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                            parseFloat(item.gainLoss) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatCurrency(item.gainLoss)} ({item.gainLossPercent}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bar Chart Comparison */}
            <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Asset Class Comparison</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationData.bySchemeType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {allocationData.bySchemeType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

