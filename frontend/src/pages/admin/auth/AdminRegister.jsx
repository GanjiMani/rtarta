import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../services/AuthContext";
import {
    User,
    Lock,
    Mail,
    Briefcase,
    Shield,
    Key,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff
} from "lucide-react";

// InputField Component
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

                {type === "select" ? (
                    <select
                        name={name}
                        value={value}
                        onChange={onChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors outline-none
              ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                        {...props}
                    >
                        <option value="">Select {label}</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={inputType}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors outline-none
          ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                        autoComplete="new-password"
                        {...props}
                    />
                )}
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

export default function AdminRegister() {
    const { fetchWithoutAuth } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        employee_id: "",
        sub_role: "",
        secret_key: "",
        password: "",
        confirmPassword: ""
    });

    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [apiSuccess, setApiSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Admin Roles
    const adminRoles = [
        { value: "rta_ceo", label: "RTA CEO / Top Management" },
        { value: "rta_coo", label: "RTA COO / Operations Head" },
        { value: "compliance_head", label: "Head of Compliance" },
        { value: "operations_manager", label: "Operations Manager" },
        { value: "senior_executive", label: "Senior Executive" },
        { value: "executive", label: "Executive / Analyst" },
        { value: "customer_service", label: "Customer Service" },
    ];

    const validate = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.full_name) newErrors.full_name = "Full Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid Email Format";

        if (!formData.employee_id) newErrors.employee_id = "Employee ID is required";
        if (!formData.sub_role) newErrors.sub_role = "Role selection is required";
        if (!formData.secret_key) newErrors.secret_key = "Corporate Secret Key is required";

        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8) newErrors.password = "Password too short (min 8 chars)";

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        setApiSuccess("");

        if (validate()) {
            setIsSubmitting(true);
            try {
                const res = await fetchWithoutAuth("/api/admin/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        email: formData.email,
                        employee_id: formData.employee_id,
                        sub_role: formData.sub_role,
                        secret_key: formData.secret_key,
                        password: formData.password
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.detail || "Registration Failed");
                }

                setApiSuccess("Admin Account Created Successfully! Please login.");
                setTimeout(() => navigate("/admin/login"), 2000);

            } catch (error) {
                setApiError(error.message);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="bg-white rounded-3xl w-full max-w-2xl p-8 md:p-12 shadow-2xl border border-gray-100 z-10 relative">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h1>
                    <p className="text-gray-500">Create new RTA Official Account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="Full Name"
                            name="full_name"
                            icon={User}
                            value={formData.full_name}
                            onChange={handleChange}
                            error={errors.full_name}
                            placeholder="John Doe"
                        />
                        <InputField
                            label="Employee ID"
                            name="employee_id"
                            icon={Briefcase}
                            value={formData.employee_id}
                            onChange={handleChange}
                            error={errors.employee_id}
                            placeholder="RTA-001"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="Official Email"
                            name="email"
                            type="email"
                            icon={Mail}
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="john@rtasystem.com"
                        />
                        <InputField
                            label="Role"
                            name="sub_role"
                            type="select"
                            icon={Shield}
                            value={formData.sub_role}
                            onChange={handleChange}
                            error={errors.sub_role}
                            options={adminRoles}
                        />
                    </div>

                    <InputField
                        label="Corporate Secret Key"
                        name="secret_key"
                        type="password"
                        icon={Key}
                        value={formData.secret_key}
                        onChange={handleChange}
                        error={errors.secret_key}
                        placeholder="Provided by IT Dept"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <InputField
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            icon={Lock}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            placeholder="Re-enter password"
                        />
                    </div>

                    {apiError && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2" /> {apiError}
                        </div>
                    )}
                    {apiSuccess && (
                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center border border-green-200">
                            <CheckCircle className="w-4 h-4 mr-2" /> {apiSuccess}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 shadow-lg shadow-gray-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Processing..." : "Register Official Account"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-center text-gray-600">
                    Already have an account?{" "}
                    <Link to="/admin/login" className="text-blue-800 font-medium hover:underline">
                        Login Here
                    </Link>
                </p>
            </div>
        </div>
    );
}
