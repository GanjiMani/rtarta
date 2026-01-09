import React, { useState, useMemo } from "react";

const PAGE_SIZE = 5;

export default function DocumentManagerr() {
  const [documents, setDocuments] = useState([
    { id: "D001", name: "SEBI Compliance Report.pdf", uploadedOn: "2025-09-01", url: "#" },
    { id: "D002", name: "Audit Log 2025 Q1.xlsx", uploadedOn: "2025-07-15", url: "#" },
  ]);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      const file = e.target.files[0];
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
      ];
      if (!validTypes.includes(file.type)) {
        setUploadStatus({ success: false, message: "Invalid file type. Allowed types: PDF, Excel, Word, TXT." });
        setUploadFile(null);
        setUploadName("");
        e.target.value = null;
        return;
      }
      setUploadFile(file);
      setUploadName(file.name);
      setUploadStatus(null);
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      setUploadStatus({ success: false, message: "Please select a file to upload." });
      return;
    }
    const newDoc = {
      id: `D${documents.length + 1}`.padStart(4, "0"),
      name: uploadName,
      uploadedOn: new Date().toISOString().slice(0, 10),
      url: "#" // replace with actual uploaded file URL on backend
    };
    setDocuments([newDoc, ...documents]);
    setUploadFile(null);
    setUploadName("");
    setUploadStatus({ success: true, message: `Uploaded ${uploadName} successfully!` });
    setPage(1);
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [documents, searchTerm]);

  const pageCount = Math.ceil(filteredDocs.length / PAGE_SIZE);
  const currentPageDocs = filteredDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Manager</h1>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleUpload}
          disabled={!uploadFile}
          className={`px-4 py-2 rounded text-white ${uploadFile ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
        >
          Upload
        </button>
        <input
          type="text"
          placeholder="Search documents"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded flex-grow min-w-[150px]"
          aria-label="Search documents by name"
        />
      </div>

      {uploadStatus && (
        <p className={`mb-4 font-medium ${uploadStatus.success ? "text-green-600" : "text-red-600"}`} role="alert">
          {uploadStatus.message}
        </p>
      )}

      <ul className="bg-white border rounded shadow divide-y max-h-96 overflow-auto">
        {currentPageDocs.length === 0 ? (
          <li className="p-4 text-center text-gray-500">No documents found.</li>
        ) : (
          currentPageDocs.map(({ id, name, uploadedOn, url }) => (
            <li key={id} className="p-3 flex justify-between items-center hover:bg-gray-50">
              <span>{name}</span>
              <span className="flex items-center gap-4 text-sm text-gray-500">
                <span>Uploaded: {uploadedOn}</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  aria-label={`Download ${name}`}
                >
                  Download
                </a>
              </span>
            </li>
          ))
        )}
      </ul>

      {pageCount > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded border ${page === 1 ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"}`}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="px-3 py-1">{page} / {pageCount}</span>
          <button
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className={`px-3 py-1 rounded border ${page === pageCount ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"}`}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
