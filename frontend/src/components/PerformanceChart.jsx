import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PerformanceChart({data}) {
  return (
    <div className="card" style={{height:240}}>
      <div className="text-sm text-gray-600 mb-2">Performance</div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0B5ED7" strokeWidth={3} dot={{r:2}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
