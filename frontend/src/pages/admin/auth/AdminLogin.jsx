import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../services/AuthContext";
import {
    User,
    Lock,
    AlertCircle,
    Eye,
    EyeOff,
    Shield,
    Briefcase
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
                    className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors outline-none
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

export default function AdminLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ userId: "", password: "" });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Regex patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validate = () => {
        const newErrors = {};
        if (!formData.userId) {
            newErrors.userId = "Email Address is required";
        } else if (!emailRegex.test(formData.userId)) {
            newErrors.userId = "Enter a valid Email Address";
        }
        if (!formData.password) {
            newErrors.password = "Password is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                const profileData = await login(formData.userId, formData.password, "admin"); // Pass type='admin'
                // AuthContext handles redirection based on Role, but we can force check
                if (profileData.role === 'admin') {
                    navigate("/admin/admindashboard", { replace: true });
                } else {
                    setApiError("Access Denied: You do not have Admin privileges.");
                }
            } catch (error) {
                setApiError(error.message || "Invalid credentials or server error");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="bg-white rounded-3xl w-full max-w-md p-8 md:p-12 shadow-2xl border border-gray-100 z-10 relative">
                <div className="text-center mb-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-blue-700" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
                    <p className="text-gray-500">Secure Access for RTA Officials</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField
                        label="Official Email"
                        name="userId"
                        icon={Briefcase}
                        value={formData.userId}
                        onChange={handleChange}
                        error={errors.userId}
                        placeholder="admin@rtasystem.com"
                    />

                    <InputField
                        label="Password"
                        name="password"
                        type="password"
                        icon={Lock}
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder="Min 8 characters"
                    />

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-gray-600 cursor-pointer">
                            <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                            Remember Me
                        </label>
                        <Link to="/admin/forgot-password" className="text-blue-600 font-medium hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    {apiError && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2" /> {apiError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Authenticating..." : "Login to Admin Console"}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>Authorized Personnel Only.</p>
                    <p>Unauthorized access is a punishable offense.</p>
                </div>
            </div>
        </div>
    );
}
