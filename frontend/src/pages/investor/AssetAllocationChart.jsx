// src/pages/investor/AssetAllocationChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#0B5ED7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AssetAllocationChart({ data }) {
  // expected data: [{ name: 'Equity', value: 60 }, { name: 'Debt', value: 30 }, { name:'Hybrid', value:10 }]
  const chartData = data || [
    { name: "Equity", value: 60 },
    { name: "Debt", value: 25 },
    { name: "Hybrid", value: 10 },
    { name: "Liquid", value: 5 },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-2">Asset Allocation</div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
              {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
