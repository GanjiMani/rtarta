// File: src/pages/distributor/DistributorDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function DistributorDashboard() {
  // Dummy data for demonstration - replace with API data as needed
  const totalAUM = 1234567;
  const activeClients = 128;
  const pendingOnboardings = 3;
  const recentCommissions = 45789;
  const nextPayoutDate = "2025-10-15";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6">Distributor Dashboard</h1>

      {/* Snapshot Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <p className="text-lg font-medium text-gray-700">Total AUM Introduced</p>
          <p className="mt-2 text-4xl font-bold text-blue-700">
            ₹ {totalAUM.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <p className="text-lg font-medium text-gray-700">Active Clients</p>
          <p className="mt-2 text-4xl font-bold text-blue-700">{activeClients}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <p className="text-lg font-medium text-gray-700">Pending Onboardings</p>
          <p className="mt-2 text-4xl font-bold text-blue-700">{pendingOnboardings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <p className="text-lg font-medium text-gray-700">Recent Commissions</p>
          <p className="mt-2 text-4xl font-bold text-green-600">
            ₹ {recentCommissions.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center border">
          <p className="text-lg font-medium text-gray-700">Next Payout Date</p>
          <p className="mt-2 text-2xl font-semibold text-blue-500">
            {new Date(nextPayoutDate).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Quick Action Links */}
      <section className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/distributor/onboarding"
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Onboard New Client
          </Link>
          <Link
            to="/distributor/portfolio"
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            View Client Portfolio
          </Link>
          <Link
            to="/distributor/support"
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Raise Support Ticket
          </Link>
        </div>
      </section>
    </div>
  );
}
