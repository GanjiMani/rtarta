import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ChevronLeft
} from "lucide-react";

// InputField Component
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
          className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors outline-none
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
      <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
        <div className="w-full max-w-md p-8 border border-gray-100 shadow-sm rounded-2xl text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">Missing verification details.</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md p-8 border border-gray-100 shadow-sm rounded-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-sm text-gray-500 mt-2">Create a new password</p>
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
            placeholder="Re-enter password"
          />

          {error && !error.includes("match") && !error.includes("Required") && !error.includes("Missing") && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {message && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2" /> {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
  );
}
