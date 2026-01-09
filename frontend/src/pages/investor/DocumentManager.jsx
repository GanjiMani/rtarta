import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Document types based on backend DocumentType enum
const documentTypes = [
  { value: "kyc_pan", label: "KYC - PAN Card" },
  { value: "kyc_aadhaar", label: "KYC - Aadhaar Card" },
  { value: "kyc_passport", label: "KYC - Passport" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "bank_cheque", label: "Bank Cheque" },
  { value: "address_proof", label: "Address Proof" },
  { value: "income_proof", label: "Income Proof" },
  { value: "signature_proof", label: "Signature Proof" },
  { value: "nominee_photo", label: "Nominee Photo" },
  { value: "other", label: "Other" },
];

export default function DocumentManager() {
  const { fetchWithAuth } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("kyc_pan");
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [fetchWithAuth]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/investor/profile/documents`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to fetch documents" }));
        throw new Error(errorData.detail || "Failed to fetch documents");
      }
      const data = await res.json();
      setDocuments(data.data || []);
    } catch (err) {
      setError("Failed to load documents: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError("File size exceeds 10MB limit");
        setSelectedFile(null);
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
      setUploadStatus("");
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload");
      setUploadStatus("");
      return;
    }
    if (!selectedDocType) {
      setError("Please select a document type");
      setUploadStatus("");
      return;
    }
    
    setUploadStatus("");
    setError("");
    setSuccessMsg("");
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", selectedDocType);

      const res = await fetchWithAuth(`/api/investor/profile/documents`, {
        method: "POST",
        body: formData,
        // Do not set 'Content-Type' header manually for FormData - browser will set it with boundary
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to upload document" }));
        throw new Error(errData.detail || "Failed to upload document");
      }
      
      const result = await res.json();
      setSuccessMsg("Document uploaded successfully and is pending verification!");
      setTimeout(() => setSuccessMsg(""), 5000);
      setSelectedFile(null);
      setUploadStatus("");
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Reload documents
      await fetchDocuments();
    } catch (err) {
      setError("Error uploading file: " + err.message);
      setUploadStatus("");
      setSuccessMsg("");
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/documents/${documentId}/download`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to download file" }));
        throw new Error(errorData.detail || "Failed to download file");
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError("Download error: " + err.message);
    }
  };

  const handleDelete = async (documentId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }
    
    try {
      setError("");
      const res = await fetchWithAuth(`/api/investor/profile/documents/${documentId}`, {
        method: "DELETE",
      });
      
      if (!res.ok && res.status !== 204) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to delete document" }));
        throw new Error(errorData.detail || "Failed to delete document");
      }
      
      setSuccessMsg("Document deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchDocuments();
    } catch (err) {
      setError("Failed to delete document: " + err.message);
      setSuccessMsg("");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Document Manager</h2>
          <p className="text-gray-600 mt-1">Upload and manage your KYC and supporting documents</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMsg}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Document</h3>
            <form onSubmit={handleFileUpload}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type *
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                  </p>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={!selectedFile || !selectedDocType}
              >
                Upload Document
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No documents uploaded yet.</p>
                <p className="text-sm mt-2">Upload a document above to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded On
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.document_name || doc.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {doc.uploaded_on ? new Date(doc.uploaded_on).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              doc.status
                            )}`}
                          >
                            {doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1).replace('_', ' ') : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleDownload(doc.id, doc.document_name || doc.name)}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id, doc.document_name || doc.name)}
                              className="text-red-600 hover:text-red-900 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}