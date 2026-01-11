import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Globe,
  Eye,
  EyeOff,
  LogIn
} from "lucide-react";

// InputField Component (Same as Register.jsx for consistency)
const InputField = ({ label, name, type = "text", icon: Icon, placeholder, options = [], value, onChange, error, ...props }) => {
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  const validate = () => {
    const newErrors = {};
    if (!formData.userId) {
      newErrors.userId = "Email or PAN is required";
    } else if (!emailRegex.test(formData.userId) && !panRegex.test(formData.userId.toUpperCase())) {
      newErrors.userId = "Enter a valid Email or PAN (e.g., ABCDE1234F)";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (validate()) {
      setIsSubmitting(true);
      try {
        const profileData = await login(formData.userId, formData.password);
        if (profileData.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (profileData.role === "amc") {
          navigate("/amc", { replace: true });
        } else if (profileData.role === "user" || profileData.role === "investor") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        setApiError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[500px]">

        {/* Left Side - Branding */}
        <div className="hidden md:flex w-1/2 bg-blue-600 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-blue-100">Access your portfolio and track your investments.</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Login</h3>
                <p className="text-xs text-blue-100">Two-factor authentication enabled</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">24/7 Access</h3>
                <p className="text-xs text-blue-100">Monitor your wealth anytime</p>
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

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">Investor Login</h2>
            <p className="text-sm text-gray-500 mt-1">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email or PAN"
              name="userId"
              icon={User}
              value={formData.userId}
              onChange={handleChange}
              error={errors.userId}
              placeholder="Enter Email or PAN"
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-blue-600 font-medium hover:underline">
                Forgot Password?
              </Link>
            </div>

            {apiError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-gray-600">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Create Account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
