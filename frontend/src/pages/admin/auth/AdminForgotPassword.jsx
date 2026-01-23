import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../services/AuthContext";
import {
    Mail,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    ShieldAlert
} from "lucide-react";

// InputField Component reuse
const InputField = ({ label, name, type = "text", icon: Icon, placeholder, value, onChange, error, ...props }) => {
    return (
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
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors outline-none
            ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                    {...props}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{error}</p>}
        </div>
    );
};

export default function AdminForgotPassword() {
    // const { forgotPassword } = useAuth(); // Assume this exists or mock it

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email) {
            setError("Email is required");
            return;
        }

        // Simple mock since backend might not have this specifically for admin separate from users
        setIsSubmitting(true);
        setTimeout(() => {
            setSuccess("If an account exists with this email, a reset link has been sent to your corporate inbox.");
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            </div>

            <div className="bg-white rounded-3xl w-full max-w-md p-8 md:p-12 shadow-2xl border border-gray-100 z-10 relative">
                <div className="text-center mb-8">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Admin Password</h1>
                    <p className="text-gray-500 text-sm">Enter your official email address to receive password reset instructions.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField
                        label="Official Email"
                        name="email"
                        type="email"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={error}
                        placeholder="admin@rtasystem.com"
                    />

                    {success && (
                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-start border border-green-200">
                            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || success}
                        className="w-full flex justify-center items-center py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 shadow-lg transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/admin/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
