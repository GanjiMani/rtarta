// File: src/pages/distributor/DistributorRegister.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function DistributorRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    pan: "",
    documents: [], // Array to hold multiple uploaded files
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.mobile) newErrors.mobile = "Mobile number is required";
    if (!formData.pan) newErrors.pan = "PAN is required";
    if (formData.documents.length === 0) newErrors.documents = "Please upload documents";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    // Append new files to existing
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newFiles],
    }));
    // Reset file input to allow selecting same files again if needed
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise((res) => setTimeout(res, 1000));
        alert("Registration successful! Please login.");
        localStorage.removeItem("user");
        navigate("/distributor/login", { replace: true });
      } catch {
        setErrors({ form: "Registration failed. Please try again later." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-blue-600 text-center">
          Distributor Registration
        </h2>

        {errors.form && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{errors.form}</div>
        )}

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>Required Documents to Upload:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>PAN Card (mandatory)</li>
            <li>Proof of Identity (Aadhaar, Passport, Driving License)</li>
            <li>Proof of Address (Utility bill, Bank statement, Aadhaar)</li>
            <li>Distributor Registration Certificate (SEBI/AMFI)</li>
            <li>AMFI MFD Code Certificate</li>
            <li>Recent Passport Size Photograph</li>
            <li>Bank Proof (Cancelled cheque or bank statement)</li>
          </ul>
          <p className="mt-2 text-xs text-gray-600">
            Accepted formats: PDF, JPEG, PNG. Max size per file: 2MB.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">Name</label>
            <input
              className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Email</label>
            <input
              className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Mobile</label>
            <input
              className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Mobile Number"
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">PAN</label>
            <input
              className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.pan ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="PAN Number"
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.pan && (
              <p className="text-red-500 text-sm mt-1">{errors.pan}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Upload Documents</label>
            <input
              type="file"
              accept=".pdf,.jpeg,.png"
              multiple
              onChange={handleFileChange}
              className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.documents ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.documents && (
              <p className="text-red-500 text-sm mt-1">{errors.documents}</p>
            )}
            {formData.documents.length > 0 && (
              <ul className="mt-2 text-sm text-gray-700 list-disc list-inside max-h-24 overflow-auto">
                {formData.documents.map((file, idx) => (
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md font-semibold text-white transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link to="/distributor/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
