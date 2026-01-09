// File: src/pages/global/GlobalPortal.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function GlobalPortal() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">Welcome to the RTA Global Portal</h1>
      <p className="mb-8 text-lg text-gray-700 max-w-xl text-center">
        Please select your portal to proceed
      </p>
      <div className="flex gap-6">
        <Link to="/investor/login" className="btn btn-primary">
          Investor Portal
        </Link>
        <Link to="/distributor/login" className="btn btn-primary">
          Distributor Portal
        </Link>
        <Link to="/amc/login" className="btn btn-primary">
          AMC Portal
        </Link>
        <Link to="/sebi/login" className="btn btn-primary">
          SEBI Portal
        </Link>
        <Link to="/admin/login" className="btn btn-primary">
          Admin Portal
        </Link>
      </div>
    </div>
  );
}
