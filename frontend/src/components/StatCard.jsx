import React from 'react'
export default function StatCard({title, value, subtitle}) {
  return (
    <div className="card text-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-primary mt-2">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}
