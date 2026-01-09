import { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";

export default function Approvals() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({
    status: "pending",
    approval_type: "",
    priority: "",
  });
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionComments, setActionComments] = useState("");

  useEffect(() => {
    fetchApprovals();
    fetchStats();
  }, [page, filters]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      });

      const res = await fetchWithAuth(`/admin/approvals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth("/admin/approvals/stats/summary");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleAction = async (approvalId, action) => {
    try {
      setActionLoading(approvalId);
      const res = await fetchWithAuth(`/admin/approvals/${approvalId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          comments: actionComments,
        }),
      });

      if (res.ok) {
        await fetchApprovals();
        await fetchStats();
        setShowDetails(false);
        setActionComments("");
      }
    } catch (err) {
      console.error("Failed to process approval", err);
    } finally {
      setActionLoading(null);
    }
  };

  const viewApprovalDetails = async (approvalId) => {
    try {
      const res = await fetchWithAuth(`/admin/approvals/${approvalId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedApproval(data.approval);
        setShowDetails(true);
      }
    } catch (err) {
      console.error("Failed to fetch approval details", err);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      normal: "bg-blue-100 text-blue-800",
      low: "bg-gray-100 text-gray-800",
    };
    return colors[priority] || colors.normal;
  };

  const getStatusIcon = (status) => {
    const icons = {
      approved: <CheckCircle className="w-5 h-5 text-green-600" />,
      rejected: <XCircle className="w-5 h-5 text-red-600" />,
      pending: <Clock className="w-5 h-5 text-yellow-600" />,
      under_review: <AlertCircle className="w-5 h-5 text-blue-600" />,
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-600" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Approval Workflow
        </h1>
        <p className="text-gray-600">
          Review and approve pending transactions and requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Approvals</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.total_approvals || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.pending_approvals || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.approved_count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.rejected_count || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={fetchApprovals}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>
            <select
              value={filters.approval_type}
              onChange={(e) =>
                setFilters({ ...filters, approval_type: e.target.value })
              }
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="transaction">Transaction</option>
              <option value="kyc_verification">KYC Verification</option>
              <option value="bank_mandate">Bank Mandate</option>
              <option value="high_value_transaction">High Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Approval ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No approvals found
                  </td>
                </tr>
              ) : (
                approvals.map((approval) => (
                  <tr
                    key={approval.approval_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {approval.approval_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {approval.approval_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {approval.request_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                          approval.priority
                        )}`}
                      >
                        {approval.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {approval.current_level} / {approval.total_levels}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(approval.status)}
                        <span className="text-sm text-gray-900">
                          {approval.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(approval.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewApprovalDetails(approval.approval_id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {approval.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleAction(approval.approval_id, "approve")
                              }
                              disabled={actionLoading === approval.approval_id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleAction(approval.approval_id, "reject")
                              }
                              disabled={actionLoading === approval.approval_id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Details Modal */}
      {showDetails && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Approval Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Approval ID
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedApproval.approval_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Type
                  </label>
                  <p className="text-lg text-gray-900">
                    {selectedApproval.approval_type.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Request ID
                  </label>
                  <p className="text-lg text-gray-900">
                    {selectedApproval.request_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusIcon(selectedApproval.status)}
                    <span className="ml-2 text-lg text-gray-900">
                      {selectedApproval.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Priority
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(
                      selectedApproval.priority
                    )}`}
                  >
                    {selectedApproval.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Approval Level
                  </label>
                  <p className="text-lg text-gray-900">
                    {selectedApproval.current_level} / {selectedApproval.total_levels}
                  </p>
                </div>
              </div>

              {selectedApproval.request_data && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Request Data
                  </label>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(selectedApproval.request_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedApproval.status === "pending" && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add comments for approval/rejection..."
                  />
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() =>
                        handleAction(selectedApproval.approval_id, "approve")
                      }
                      disabled={actionLoading === selectedApproval.approval_id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleAction(selectedApproval.approval_id, "reject")
                      }
                      disabled={actionLoading === selectedApproval.approval_id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedApproval.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-red-800">
                    Rejection Reason
                  </label>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedApproval.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
