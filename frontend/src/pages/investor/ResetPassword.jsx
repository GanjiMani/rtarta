import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Lock,
  CheckCircle,
  AlertCircle,
  Globe,
  Eye,
  EyeOff,
  KeyRound,
  ChevronLeft
} from "lucide-react";

// InputField Component (Reusable with password toggle)
const InputField = ({ label, name, type = "text", icon: Icon, placeholder, value, onChange, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        </div>

        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
            ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{error}</p>}
    </div>
  );
};

export default function ResetPassword() {
  const { fetchPublic } = useAuth();
  const location = useLocation();
  const { email, otp } = location.state || {}; // Get email and OTP from state

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Basic validation
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!email || !otp) {
      setError("Missing verification details. Please start over.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchPublic("/api/investor/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          new_password: password
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to reset password");
      }

      const data = await res.json();
      setMessage(data.message || "Password reset successful! Redirecting...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email || !otp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Missing verification details. You must verify your OTP first.</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Go to Forgot Password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[500px]">

        {/* Left Side - Branding */}
        <div className="hidden md:flex w-1/2 bg-blue-600 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
            <p className="text-blue-100">Create a strong password to secure your account.</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Security Tip</h3>
                <p className="text-xs text-blue-100">Use a mix of letters, numbers & symbols</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-sm text-gray-500 mt-1">Please enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="New Password"
              name="password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && !password ? "Required" : ""}
              placeholder="Min 8 chars"
            />

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              icon={KeyRound}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={error && error.includes("match") ? error : ""}
              placeholder="Re-enter new password"
            />

            {error && !error.includes("match") && !error.includes("Required") && !error.includes("Missing") && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {message && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" /> {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>

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
