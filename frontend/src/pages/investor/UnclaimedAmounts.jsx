import React, { useEffect, useState } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  FileArchive,
  RefreshCw,
  CheckCircle,
  X,
  AlertCircle,
  Info,
  Wallet,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
  Calendar,
  CreditCard,
} from "lucide-react";

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
        `Claim request submitted successfully for ${formatCurrency(unclaimedItem.total_amount || unclaimedItem.amount)}! ` +
        `The amount will be processed and credited to your registered bank account.`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(""), 5000);

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
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status, claimed) => {
    const isPending = !claimed || status === "Pending";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${isPending
            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
            : "bg-green-100 text-green-800 border-green-200"
          }`}
      >
        {isPending ? "Pending" : "Claimed"}
      </span>
    );
  };

  const getAgingBadge = (days) => {
    if (!days) return null;
    let color = "bg-green-100 text-green-800 border-green-200";
    let label = `${days} days`;

    if (days > 365) {
      color = "bg-red-100 text-red-800 border-red-200";
      label = `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`;
    } else if (days > 90) {
      color = "bg-orange-100 text-orange-800 border-orange-200";
      label = `${Math.floor(days / 30)} months`;
    } else if (days > 30) {
      color = "bg-yellow-100 text-yellow-800 border-yellow-200";
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
        {label}
      </span>
    );
  };

  const totalUnclaimed = unclaimed.reduce(
    (sum, item) => sum + (parseFloat(item.total_amount || item.amount) || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading unclaimed amounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative px-6 py-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                <FileArchive className="w-8 h-8 text-amber-100" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Unclaimed Amounts</h1>
                <p className="text-amber-100 text-lg opacity-90">
                  View and claim your unclaimed redemption and dividend amounts
                </p>
              </div>
            </div>
            <button
              onClick={fetchUnclaimed}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {unclaimed.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Total Unclaimed Amount</p>
                <p className="text-4xl font-bold">{formatCurrency(totalUnclaimed)}</p>
                <p className="text-amber-100 text-sm mt-2">
                  {unclaimed.length} {unclaimed.length === 1 ? "item" : "items"} pending claim
                </p>
              </div>
              <div className="hidden md:block">
                <DollarSign className="h-20 w-20 text-amber-300 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">About Unclaimed Amounts</h3>
              <p className="text-sm text-blue-700">
                Unclaimed amounts are redemption proceeds or dividend payments that couldn't be credited to your bank account
                due to incorrect bank details, account closure, or other issues. You can claim these amounts, and they will be
                processed and credited to your registered bank account. Accumulated interest, if any, is included in the total amount.
              </p>
            </div>
          </div>
        </div>

        {/* Unclaimed Amounts List */}
        {unclaimed.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Unclaimed Amounts</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have any unclaimed amounts. All your redemption and dividend payments have been successfully processed and credited to your account.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-bold text-gray-900">Unclaimed Amounts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and claim your pending amounts
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
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
                      <tr key={item.id || item.unclaimed_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.transaction_id || "N/A"}
                          </div>
                          {item.unclaimed_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {item.unclaimed_id}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.scheme_name || item.scheme_id || "N/A"}
                          </div>
                          {item.scheme_id && (
                            <div className="text-xs text-gray-500">{item.scheme_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{item.folio_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {item.transaction_type?.replace(/_/g, " ") || item.unclaimed_reason || "N/A"}
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.unclaimed_date)}
                            </div>
                            {item.days_unclaimed > 0 && (
                              <div className="mt-1">{getAgingBadge(item.days_unclaimed)}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status, item.claimed)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {canClaim ? (
                            <button
                              onClick={() => handleClaim(item.unclaimed_id || item.id, item)}
                              disabled={isClaiming}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-green-500/30 flex items-center gap-2 mx-auto"
                            >
                              {isClaiming ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Claim
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Already claimed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Info Footer */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Claim requests are processed within 3-5 business days</li>
                    <li>Amounts will be credited to your registered bank account</li>
                    <li>Please ensure your bank account details are up to date in your profile</li>
                    <li>For amounts unclaimed for more than 7 years, additional verification may be required</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
