import { useState } from "react";
import { useAuth } from "../../services/AuthContext";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

export default function NAVUpload() {
  const { fetchWithAuth } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    }
  };

  const validateFile = async (fileToValidate) => {
    const errors = [];
    
    // Check file type
    if (!fileToValidate.name.endsWith('.csv') && !fileToValidate.name.endsWith('.xlsx')) {
      errors.push("File must be CSV or Excel format");
    }
    
    // Check file size (max 10MB)
    if (fileToValidate.size > 10 * 1024 * 1024) {
      errors.push("File size must be less than 10MB");
    }
    
    setValidationErrors(errors);
    
    // Preview CSV
    if (fileToValidate.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(0, 6); // First 5 rows
        setPreview(lines);
      };
      reader.readAsText(fileToValidate);
    }
  };

  const handleUpload = async () => {
    if (!file || validationErrors.length > 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithAuth("/admin/nav/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        alert("NAV uploaded successfully!");
        setFile(null);
        setPreview(null);
        fetchUploadHistory();
      } else {
        const error = await res.json();
        alert(`Upload failed: ${error.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload NAV file");
    } finally {
      setUploading(false);
    }
  };

  const fetchUploadHistory = async () => {
    try {
      const res = await fetchWithAuth("/admin/nav/history");
      if (res.ok) {
        const data = await res.json();
        setUploadHistory(data.uploads || []);
      }
    } catch (err) {
      console.error("Failed to fetch upload history", err);
    }
  };

  const downloadTemplate = () => {
    const template = `Scheme_ID,NAV,NAV_Date
S001,250.00,2024-01-15
S002,1200.00,2024-01-15
S003,80.00,2024-01-15`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nav_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NAV Upload</h1>
        <p className="text-gray-600">
          Upload and manage Net Asset Values (NAV) for mutual fund schemes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Upload NAV File
          </h2>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="nav-file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="nav-file"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                CSV or Excel files only (Max 10MB)
              </p>
            </label>
          </div>

          {/* Selected File */}
          {file && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setValidationErrors([]);
                }}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">
                  Validation Errors
                </h3>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">File Preview</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.split(',').map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-2 text-left font-medium text-gray-700"
                        >
                          {header.trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {preview.slice(1, 6).map((row, index) => (
                      <tr key={index}>
                        {row.split(',').map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-gray-900"
                          >
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleUpload}
              disabled={!file || validationErrors.length > 0 || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload NAV
                </>
              )}
            </button>
            <button
              onClick={downloadTemplate}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
          </div>
        </div>

        {/* Instructions & History */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Instructions
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  Download the template CSV file to ensure correct format
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  Required columns: Scheme_ID, NAV, NAV_Date
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  NAV Date must be in YYYY-MM-DD format
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  NAV values must be positive numbers
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  Maximum file size: 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Upload History */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Uploads
              </h2>
              <button
                onClick={fetchUploadHistory}
                className="text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {uploadHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upload history
                </p>
              ) : (
                uploadHistory.map((upload, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {upload.filename}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          upload.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {upload.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(upload.uploaded_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {upload.records_processed || 0} records processed
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
