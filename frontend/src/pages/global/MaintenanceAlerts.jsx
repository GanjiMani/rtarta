import React from "react";

export default function MaintenanceAlerts() {
  // Dummy maintenance info (typically can be fetched from backend)
  const maintenanceInfo = {
    startDate: "2025-10-05 10:00 PM IST",
    endDate: "2025-10-06 04:00 AM IST",
    message:
      "The system will undergo scheduled maintenance during this period. Services may be intermittently unavailable. We apologize for the inconvenience and appreciate your understanding.",
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white shadow rounded-lg p-8 max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-5">Scheduled Maintenance</h1>
        <p className="text-gray-700 text-lg mb-4">{maintenanceInfo.message}</p>
        <p className="text-gray-600 font-semibold">
          <span className="text-blue-600">Start:</span> {maintenanceInfo.startDate}
        </p>
        <p className="text-gray-600 font-semibold">
          <span className="text-blue-600">End:</span> {maintenanceInfo.endDate}
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Please plan your transactions accordingly. For urgent assistance, contact support.
        </p>
      </div>
    </div>
  );
}
