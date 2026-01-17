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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 md:p-12 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">RTA Portal</h1>
          <p className="text-gray-500">Welcome back! Please login to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
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
            className="w-full flex justify-center items-center py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
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
  );
}
