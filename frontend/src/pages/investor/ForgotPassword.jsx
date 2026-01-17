import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ChevronLeft
} from "lucide-react";

// InputField Component
const InputField = ({ label, name, type = "text", icon: Icon, placeholder, value, onChange, error, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors outline-none
          ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
        {...props}
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{error}</p>}
  </div>
);

export default function ForgotPassword() {
  const { fetchPublic } = useAuth();
  const navigate = useNavigate();
  const [emailOrPan, setEmailOrPan] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!emailOrPan) {
      setError("Please enter your registered Email");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchPublic("/api/investor/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: emailOrPan }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to request password reset");
      }

      const data = await res.json();
      setMessage(data.message || "OTP sent successfully. Please check your email.");

      setTimeout(() => {
        navigate("/verify-otp", { state: { email: emailOrPan } });
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md p-8 border border-gray-100 shadow-sm rounded-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
          <p className="text-sm text-gray-500 mt-2">Enter your email to receive a verification code</p>
        </div>

        {!message ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Email Address"
              name="emailOrPan"
              icon={Mail}
              value={emailOrPan}
              onChange={(e) => setEmailOrPan(e.target.value)}
              error={error}
              placeholder="name@example.com"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send OTP"}
              {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
            <p className="text-gray-600 mb-6">{message}</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
