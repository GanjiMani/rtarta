import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { FileText, Upload, Download, Trash2, AlertCircle, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function DocumentManager() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState({ type: null, id: null, index: null });
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (fetchWithAuth) {
      fetchDocuments();
    }
  }, [fetchWithAuth]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data.data || []);
    } catch (err) {
      setError("Failed to load documents: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file, documentType) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/investor/profile/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload document");
      }

      setSuccessMsg("Document uploaded successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchDocuments();
    } catch (err) {
      setError(err.message || "Failed to upload document");
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      const response = await fetchWithAuth(`/api/investor/profile/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      setSuccessMsg("Document deleted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchDocuments();
      setShowDeleteConfirm({ type: null, id: null, index: null });
    } catch (err) {
      setError(err.message || "Failed to delete document");
      setShowDeleteConfirm({ type: null, id: null, index: null });
    }
  };

  const downloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/investor/profile/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document_${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || "Failed to download document");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Manager</h1>
          <p className="text-gray-600">
            Verify and manage your essential legal documentation
          </p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
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
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex justify-end mb-6">
          <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload Document
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                const docType = prompt("Enter document type (e.g., PAN, Aadhar, KYC, Canceled Cheque):");
                if (file && docType) {
                  uploadDocument(file, docType);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Documents Archived</h3>
            <p className="text-gray-500 mb-8">
              Digitize your investment journey by uploading identity and address proofs.
            </p>
            <label className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              Upload First File
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  const docType = prompt("Enter document type:");
                  if (file && docType) {
                    uploadDocument(file, docType);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {doc.document_name || doc.name || "Legal Document"}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase mb-3">
                      {doc.document_type || "General Type"}
                      {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          doc.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {doc.status || "In Review"}
                      </span>
                      {doc.uploaded_on && (
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploaded_on).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {doc.rejection_reason && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {doc.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => downloadDocument(doc.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: "document", id: doc.id, index: null })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm.type === "document" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm({ type: null, id: null, index: null })}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteDocument(showDeleteConfirm.id)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
