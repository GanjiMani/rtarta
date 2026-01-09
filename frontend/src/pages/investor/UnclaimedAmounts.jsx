import React, { useEffect, useState } from "react";
import { useAuth } from "../../services/AuthContext";

export default function UnclaimedAmounts() {
  const { fetchWithAuth } = useAuth();
  const [unclaimed, setUnclaimed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchUnclaimed();
    }
  }, [fetchWithAuth]);

  const fetchUnclaimed = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/unclaimed");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch unclaimed amounts");
      }
      const data = await response.json();
      setUnclaimed(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load unclaimed amounts");
      console.error("Error fetching unclaimed amounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (unclaimedId, unclaimedItem) => {
    setClaimingId(unclaimedId);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetchWithAuth("/api/investor/unclaimed/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unclaimed_id: unclaimedId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Claim request failed");
      }

      const result = await response.json();
      setSuccessMsg(
        `Claim request submitted successfully for ₹${formatCurrency(unclaimedItem.total_amount || unclaimedItem.amount)}! ` +
        `The amount will be processed and credited to your registered bank account.`
      );

      // Refresh the list
      await fetchUnclaimed();
    } catch (err) {
      setError(err.message || "Failed to process claim request");
      console.error("Error claiming unclaimed amount:", err);
    } finally {
      setClaimingId(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status, claimed) => {
    const isPending = !claimed || status === "Pending";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isPending
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {isPending ? "Pending" : "Claimed"}
      </span>
    );
  };

  const getAgingBadge = (days) => {
    if (!days) return null;
    let color = "bg-green-100 text-green-800";
    if (days > 365) color = "bg-red-100 text-red-800";
    else if (days > 90) color = "bg-orange-100 text-orange-800";
    else if (days > 30) color = "bg-yellow-100 text-yellow-800";

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {days} days
      </span>
    );
  };

  const totalUnclaimed = unclaimed.reduce(
    (sum, item) => sum + (parseFloat(item.total_amount || item.amount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unclaimed Amounts</h1>
          <p className="text-gray-600">
            View and claim your unclaimed redemption and dividend amounts
          </p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading unclaimed amounts...</p>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            {unclaimed.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Unclaimed Amount</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalUnclaimed)}</p>
                    <p className="text-blue-100 text-sm mt-2">
                      {unclaimed.length} {unclaimed.length === 1 ? "item" : "items"} pending
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <svg className="h-16 w-16 text-blue-300 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Unclaimed Amounts List */}
            {unclaimed.length === 0 ? (
              <div className="bg-white shadow-lg rounded-xl p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Unclaimed Amounts</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any unclaimed amounts. All your redemption and dividend payments have been successfully processed.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Unclaimed Amounts</h3>
                  <p className="text-sm text-gray-600 mt-1">Review and claim your pending amounts</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheme
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Folio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interest
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unclaimed Since
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unclaimed.map((item) => {
                        const isClaiming = claimingId === item.unclaimed_id || claimingId === item.id;
                        const canClaim = !item.claimed && item.status === "Pending";
                        
                        return (
                          <tr key={item.id || item.unclaimed_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.transaction_id || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.scheme_name || item.scheme_id || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.folio_number}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">
                                {item.transaction_type?.replace("_", " ") || item.unclaimed_reason || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.amount || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-600">
                                {formatCurrency(item.accumulated_income || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-bold text-green-600">
                                {formatCurrency(item.total_amount || item.amount || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(item.unclaimed_date)}
                              </div>
                              {item.days_unclaimed > 0 && (
                                <div className="mt-1">{getAgingBadge(item.days_unclaimed)}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(item.status, item.claimed)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {canClaim ? (
                                <button
                                  onClick={() => handleClaim(item.unclaimed_id || item.id, item)}
                                  disabled={isClaiming}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isClaiming ? "Processing..." : "Claim"}
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Info Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900 mb-1">About Unclaimed Amounts</p>
                      <p>
                        Unclaimed amounts are redemption proceeds or dividend payments that couldn't be credited to your bank account. 
                        You can claim these amounts, and they will be processed and credited to your registered bank account. 
                        Accumulated interest, if any, is included in the total amount.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
