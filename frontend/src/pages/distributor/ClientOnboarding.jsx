// File: src/pages/distributor/ClientOnboarding.jsx
import React, { useState } from "react";

export default function ClientOnboarding() {
  const [formData, setFormData] = useState({
    name: "",
    pan: "",
    distributorCode: "",
    consentForms: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Client name is required";
    if (!formData.pan) newErrors.pan = "PAN is required";
    if (!formData.distributorCode) newErrors.distributorCode = "Distributor code is required";
    if (formData.consentForms.length === 0) newErrors.consentForms = "Please upload consent form(s)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      consentForms: [...prev.consentForms, ...newFiles],
    }));
    e.target.value = null; // reset input to allow same file select again
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      consentForms: prev.consentForms.filter((_, i) => i !== index),
    }));
  };

  const startEKYC = () => alert("e-KYC flow initiation to be implemented");

  const initiateBankMandate = () => alert("Bank mandate collection flow to be implemented");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate async onboarding process
    setTimeout(() => {
      alert("Client onboarding initiated successfully!");
      setLoading(false);
      // reset or redirect as needed
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-semibold text-blue-700 mb-4">Client Onboarding</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block font-medium mb-2">Client Name</label>
          <input 
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter client full name"
            className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && <p className="text-red-500 mt-1 text-sm">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">PAN</label>
          <input 
            name="pan"
            value={formData.pan}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter PAN"
            className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.pan ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.pan && <p className="text-red-500 mt-1 text-sm">{errors.pan}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">Distributor Code</label>
          <input 
            name="distributorCode"
            value={formData.distributorCode}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter your distributor code"
            className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.distributorCode ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.distributorCode && <p className="text-red-500 mt-1 text-sm">{errors.distributorCode}</p>}
        </div>

        <div>
          <label className="block font-medium mb-2">Upload Client Consent Forms</label>
          <input 
            type="file" 
            multiple
            accept=".pdf, .jpeg, .png"
            onChange={handleFileChange}
            disabled={loading}
            className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.consentForms ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.consentForms && <p className="text-red-500 mt-1 text-sm">{errors.consentForms}</p>}
          {formData.consentForms.length > 0 && (
            <ul className="mt-2 list-disc list-inside max-h-24 overflow-auto text-sm text-gray-700">
              {formData.consentForms.map((file, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span>{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFile(idx)} 
                    className="text-red-600 hover:text-red-800 ml-4"
                    aria-label={`Remove file ${file.name}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-4 flex-wrap mb-4">
          <button 
            type="button" 
            onClick={startEKYC} 
            disabled={loading} 
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Start e-KYC
          </button>
          <button
            type="button" 
            onClick={initiateBankMandate} 
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            Initiate Bank Mandate
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          {loading ? "Processing..." : "Submit Onboarding"}
        </button>
        
      </form>
    </div>
  );
}
