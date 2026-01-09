import React, { useState } from "react";

export default function AdminDocumentManager() {
  // Dummy documents uploaded by investors awaiting verification
  const [documents, setDocuments] = useState([
    { id: 1, investorName: "Rohan Sharma", docName: "KYC_Form.pdf", uploadedOn: "2025-08-15", status: "Pending" },
    { id: 2, investorName: "Anjali Desai", docName: "Bank_Mandate.pdf", uploadedOn: "2025-08-20", status: "Pending" },
    { id: 3, investorName: "Vijay Patil", docName: "Nomination_Form.jpg", uploadedOn: "2025-08-25", status: "Verified" },
  ]);

  // Approve a document (dummy simulation)
  const approveDocument = (id) => {
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === id ? { ...doc, status: "Verified" } : doc
      )
    );
  };

  // Reject a document (dummy simulation)
  const rejectDocument = (id) => {
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === id ? { ...doc, status: "Rejected" } : doc
      )
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Admin Document Manager</h1>

        {documents.length === 0 ? (
          <p className="text-gray-600">No documents pending verification.</p>
        ) : (
          <table className="w-full text-sm border bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left">Investor Name</th>
                <th className="p-3 border text-left">Document Name</th>
                <th className="p-3 border text-left">Uploaded On</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(({ id, investorName, docName, uploadedOn, status }) => (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="p-3 border">{investorName}</td>
                  <td className="p-3 border break-words">{docName}</td>
                  <td className="p-3 border">{uploadedOn}</td>
                  <td
                    className={`p-3 border font-semibold ${
                      status === "Verified"
                        ? "text-green-600"
                        : status === "Pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {status}
                  </td>
                  <td className="p-3 border space-x-3">
                    {status === "Pending" && (
                      <>
                        <button
                          className="text-green-600 hover:underline"
                          onClick={() => approveDocument(id)}
                        >
                          Approve
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => rejectDocument(id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(status === "Verified" || status === "Rejected") && (
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => alert(`Download triggered for ${docName}`)}
                      >
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
