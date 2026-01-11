import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
  Search,
  Filter,
  Eye,
  FileSearch,
  CloudUpload,
  ArrowRight,
  ShieldPlus,
  Clock,
  ExternalLink
} from "lucide-react";

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
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError("File size exceeds 10MB maximum capacity.");
        setSelectedFile(null);
        return;
      }
      const allowedTypes = [
        'application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid container format. Only PDF, JPG, PNG, and DOC units are accepted.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
      setSuccessMsg("");
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedDocType) return;

    setIsUploading(true);
    setError("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", selectedDocType);

      const res = await fetchWithAuth(`/api/investor/profile/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to upload document" }));
        throw new Error(errData.detail || "Failed to upload document");
      }

      setSuccessMsg("Document encrypted and stored in the secure vault.");
      setTimeout(() => setSuccessMsg(""), 5000);
      setSelectedFile(null);

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
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
      setError("Access denied: " + err.message);
    }
  };

  const handleDelete = async (documentId, filename) => {
    if (!window.confirm(`Permanently delete "${filename}" from the vault?`)) {
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

      setSuccessMsg("Document successfully purged from the system.");
      setTimeout(() => setSuccessMsg(""), 5000);
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "pending";
    switch (s) {
      case "approved":
      case "verified":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Verified</span>;
      case "rejected":
        return <span className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> In Review</span>;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocs = documents.filter(doc =>
    (doc.document_name || doc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.document_type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
          <FileText className="absolute inset-0 m-auto w-10 h-10 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Scanning Archives</h2>
        <p className="text-slate-500 font-medium mt-2">Retrieving your encrypted legal documents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 pt-16 pb-28 px-6 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-400/30 mb-6">
            <ShieldPlus className="w-4 h-4 text-emerald-200" />
            <span className="text-[10px] font-black uppercase text-emerald-100 tracking-[0.25em]">Secure Storage compliant</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            Document Vault
          </h1>
          <p className="text-emerald-50/80 font-medium max-w-2xl mx-auto text-xl leading-relaxed">
            Centralized repository for your KYC documents, bank mandates, and legal proofs with AES-256 grade encryption.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 space-y-8">
        {/* Messages */}
        {(error || successMsg) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 max-w-2xl mx-auto">
            {error && (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] text-rose-800 shadow-xl shadow-rose-900/5">
                <div className="p-2 bg-rose-100 rounded-2xl">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <p className="font-bold">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] text-emerald-800 shadow-xl shadow-emerald-900/5">
                <div className="p-2 bg-emerald-100 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-bold">{successMsg}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-12">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                  <CloudUpload className="w-8 h-8 text-emerald-600" />
                  Deposit Documents
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Quota</span>
                  <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[15%]"></div>
                  </div>
                </div>
              </div>

              <div className="p-10">
                <form onSubmit={handleFileUpload} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Classification Type</label>
                      <div className="relative">
                        <select
                          value={selectedDocType}
                          onChange={(e) => setSelectedDocType(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 appearance-none"
                          required
                        >
                          {documentTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <Layers className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedFile || isUploading}
                      className="w-full py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <ShieldPlus className="w-6 h-6" />
                      )}
                      {isUploading ? "Encrypting..." : "Anchor to Vault"}
                    </button>
                  </div>

                  <div className="relative group">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      id="doc-upload"
                      required
                    />
                    <label
                      htmlFor="doc-upload"
                      className={`block w-full border-4 border-dashed rounded-[3rem] p-12 text-center transition-all cursor-pointer ${selectedFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50/50 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10'
                        }`}
                    >
                      {selectedFile ? (
                        <div className="animate-in zoom-in-95 duration-300">
                          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                          <h4 className="text-xl font-black text-slate-800 mb-1 truncate max-w-xs">{selectedFile.name}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatFileSize(selectedFile.size)} • Ready for Archiving</p>
                        </div>
                      ) : (
                        <div>
                          <CloudUpload className="w-16 h-16 text-slate-300 mx-auto mb-4 group-hover:text-emerald-400 transition-colors" />
                          <h4 className="text-lg font-black text-slate-800 mb-2">Drop Secure Container</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">PDF, JPG, PNG or DOC Units<br />Max Capacity: 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Document Table */}
          <div className="lg:col-span-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Archives</h3>

              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search archives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold text-sm text-slate-600 w-full md:w-64 transition-all shadow-xl shadow-slate-200/20"
                  />
                </div>
                <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-xl shadow-slate-200/20">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-20 text-center shadow-xl shadow-slate-200/20">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <FileSearch className="w-12 h-12 text-slate-200" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-2">No Records Detected</h4>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-10">Your secure document repository is currently empty or no matches were found.</p>
                <div className="inline-flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.2em] text-xs">
                  Awaiting First Deposit <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Registry</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type Classification</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payload</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="group hover:bg-emerald-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                                <FileText className="w-6 h-6 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-slate-800 font-black tracking-tight">{doc.document_name || doc.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {doc.id.split('-')[0]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1 rounded-lg bg-white uppercase">
                              {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-xs font-black text-slate-400 uppercase">{formatFileSize(doc.file_size)}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                              {doc.uploaded_on ? new Date(doc.uploaded_on).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* <button className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all active:scale-95" title="Preview">
                                <Eye className="w-5 h-5" />
                              </button> */}
                              <button
                                onClick={() => handleDownload(doc.id, doc.document_name || doc.name)}
                                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all active:scale-95"
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id, doc.document_name || doc.name)}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                title="Purge"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Protocol Footer Section */}
      <div className="max-w-6xl mx-auto px-6 mt-16 pb-20">
        <div className="bg-slate-900 rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-40 -mb-40 blur-[80px]"></div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-emerald-500/20 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-white tracking-tighter mb-4">Integrity Monitoring</h4>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Anti-Tamper Active
                </span>
                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20">
                  AES-256 Storage
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-400 font-medium max-w-sm relative z-10 leading-relaxed text-right md:text-left">
            Your documents are anchored to a private distributed ledger ensuring compliance with regulatory archival mandates and physical data redundancy.
          </p>
        </div>
      </div>
    </div>
  );
}