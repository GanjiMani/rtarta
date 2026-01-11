import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
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
        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
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
      // Assuming backend expects "email"
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

      // Navigate to Verify OTP page after short delay
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[500px]">

        {/* Left Side - Branding */}
        <div className="hidden md:flex w-1/2 bg-blue-600 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Account Recovery</h1>
            <p className="text-blue-100">Don't worry, we'll help you get back in.</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Process</h3>
                <p className="text-xs text-blue-100">Identity verification required</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Support Available</h3>
                <p className="text-xs text-blue-100">Contact us if you need help</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-blue-200">
            © 2024 RTA Management. All rights reserved.
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500 rounded-full opacity-20 filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500 rounded-full opacity-20 filter blur-2xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your details to receive an OTP</p>
          </div>

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <InputField
                label="Email"
                name="emailOrPan"
                icon={Mail}
                value={emailOrPan}
                onChange={(e) => setEmailOrPan(e.target.value)}
                error={error}
                placeholder="Enter your registered Email"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
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
              <p className="text-xs text-blue-500">Redirecting to verification page...</p>
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
    </div>
  );
}
