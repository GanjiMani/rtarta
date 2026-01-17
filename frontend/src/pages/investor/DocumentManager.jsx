import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { FileText, Upload, Download, Trash2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function DocumentManager() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [documents, setDocuments] = useState([]);

  useEffect(() => { if (fetchWithAuth) fetchDocuments(); }, [fetchWithAuth]);

  const fetchDocuments = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchWithAuth("/api/investor/profile/documents");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setDocuments(data.data || []);
    } catch (err) { setError("Failed to load documents"); } finally { setLoading(false); }
  };

  const upload = async (file, type) => {
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("document_type", type);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/investor/profile/documents`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: formData
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("Uploaded!"); setTimeout(() => setSuccessMsg(""), 3000); fetchDocuments();
    } catch (err) { setError("Upload failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete document?")) return;
    try {
      const res = await fetchWithAuth(`/api/investor/profile/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      fetchDocuments();
    } catch (err) { setError("Delete failed"); }
  };

  const download = async (id, name) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/investor/profile/documents/${id}/download`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = name || `doc_${id}.pdf`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err) { setError("Download failed"); }
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500 text-sm">KYC and legal documents.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer">
          <Upload size={16} /> Upload
          <input type="file" className="hidden" accept=".pdf,.image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            const t = prompt("Document Type (e.g. PAN, Aadhaar):");
            if (f && t) upload(f, t);
            e.target.value = "";
          }} />
        </label>
      </div>

      {successMsg && <div className="mb-4 bg-green-50 text-green-700 p-2 rounded text-sm flex items-center gap-2"><CheckCircle size={16} />{successMsg}</div>}
      {error && <div className="mb-4 bg-red-50 text-red-700 p-2 rounded text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((d, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="bg-gray-50 p-2 rounded"><FileText className="text-gray-500" /></div>
                <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${d.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</div>
              </div>
              <div>
                <div className="font-bold text-gray-900 truncate" title={d.document_name}>{d.document_name || d.name}</div>
                <div className="text-xs text-gray-500">{d.document_type}</div>
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                <button onClick={() => download(d.id, d.document_name)} className="flex-1 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs rounded flex justify-center items-center gap-1"><Download size={12} /> Download</button>
                <button onClick={() => remove(d.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {!documents.length && <div className="col-span-full p-8 text-center text-gray-500 border border-gray-100 border-dashed rounded-lg">No documents uploaded.</div>}
        </div>
      )}
    </div>
  );
}
