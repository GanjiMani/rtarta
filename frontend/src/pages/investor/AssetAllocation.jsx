import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  TrendingUp,
  Briefcase,
  Activity,
  AlertCircle
} from "lucide-react";

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
  const { fetchWithAuth } = useAuth();
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
      const foliosRes = await fetchWithAuth("/api/investor/folios");
      if (!foliosRes.ok) throw new Error("Failed to fetch portfolio data");
      const foliosData = await foliosRes.json();

      let folios = [];
      if (Array.isArray(foliosData.data)) folios = foliosData.data;
      else if (Array.isArray(foliosData)) folios = foliosData;
      else if (foliosData && Array.isArray(foliosData.folios)) folios = foliosData.folios;

      if (!Array.isArray(folios) || folios.length === 0) {
        setLoading(false);
        return;
      }

      const schemeTypeMap = {};
      const amcMap = {};
      let totalValue = 0;
      let totalInvestment = 0;

      folios.forEach(folio => {
        const value = parseFloat(folio.total_value || folio.current_value || 0);
        const investment = parseFloat(folio.total_investment || 0);
        let schemeType = folio.scheme_type || "Other";
        if (schemeType !== "Other") schemeType = schemeType.charAt(0).toUpperCase() + schemeType.slice(1);
        const amcName = folio.amc_name || folio.amc_id || "Unknown AMC";

        totalValue += value;
        totalInvestment += investment;

        if (!schemeTypeMap[schemeType]) schemeTypeMap[schemeType] = { name: schemeType, value: 0, investment: 0, count: 0 };
        schemeTypeMap[schemeType].value += value;
        schemeTypeMap[schemeType].investment += investment;
        schemeTypeMap[schemeType].count += 1;

        if (!amcMap[amcName]) amcMap[amcName] = { name: amcName, value: 0, investment: 0, count: 0 };
        amcMap[amcName].value += value;
        amcMap[amcName].investment += investment;
        amcMap[amcName].count += 1;
      });

      const bySchemeType = Object.values(schemeTypeMap)
        .map(item => ({
          ...item,
          percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : 0,
          gainLoss: item.value - item.investment,
        }))
        .sort((a, b) => b.value - a.value);

      const byAMC = Object.values(amcMap)
        .map(item => ({
          ...item,
          percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : 0,
          gainLoss: item.value - item.investment,
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
      setError(err.message || "Failed to load asset allocation data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 border border-blue-100 rounded shadow text-xs">
          <p className="font-bold text-gray-900">{data.name}</p>
          <div className="flex gap-2"><span className="text-gray-500">Value:</span><span className="font-medium text-blue-600">{formatCurrency(data.value)}</span></div>
          <div className="flex gap-2"><span className="text-gray-500">Portion:</span><span className="font-medium text-gray-900">{data.payload.percentage}%</span></div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">{`${(percent * 100).toFixed(0)}%`}</text> : null;
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Simple Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Portfolio Analysis</h1>
          <p className="text-gray-500 text-sm">Visual breakdown of your investments.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded text-red-700 flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Summary Stats - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border border-gray-100 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">Current Value</p>
            <Briefcase size={16} className="text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(allocationData.totalValue)}</p>
        </div>
        <div className="p-4 border border-gray-100 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">Invested</p>
            <PieChartIcon size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(allocationData.totalInvestment)}</p>
        </div>
        <div className="p-4 border border-gray-100 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">Total P&L</p>
            <TrendingUp size={16} className={allocationData.gainLoss >= 0 ? "text-green-600" : "text-red-600"} />
          </div>
          <p className={`text-xl font-bold ${allocationData.gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
            {allocationData.gainLoss >= 0 ? '+' : ''}{formatCurrency(allocationData.gainLoss)}
          </p>
        </div>
        <div className="p-4 border border-gray-100 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs font-medium text-gray-500">XIRR (Approx)</p>
            <Activity size={16} className="text-amber-500" />
          </div>
          <p className={`text-xl font-bold ${parseFloat(allocationData.gainLossPercent) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {allocationData.gainLossPercent}%
          </p>
        </div>
      </div>

      {allocationData.bySchemeType.length === 0 && !error ? (
        <div className="text-center py-12 border border-gray-100 rounded-lg bg-gray-50">
          <p className="text-gray-500 text-sm mb-4">No portfolio data available.</p>
          <button onClick={() => navigate("/purchase")} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">Start Investing</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Asset Chart */}
            <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Asset Class Allocation</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData.bySchemeType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                      {allocationData.bySchemeType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AMC Chart */}
            <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">AMC Exposure</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData.byAMC} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                      {allocationData.byAMC.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100"><h2 className="text-xs font-bold text-gray-700 uppercase">Asset Class Details</h2></div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {allocationData.bySchemeType.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-gray-900 text-xs font-medium">{item.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-xs">{formatCurrency(item.value)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100"><h2 className="text-xs font-bold text-gray-700 uppercase">AMC Details</h2></div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {allocationData.byAMC.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-gray-900 truncate max-w-[150px] text-xs font-medium">{item.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-xs">{formatCurrency(item.value)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
