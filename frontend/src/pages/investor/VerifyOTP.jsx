import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
    Lock,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Globe,
    ChevronLeft,
    ShieldCheck
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

export default function VerifyOTP() {
    const { fetchPublic } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!email) {
            setError("Email not found. Please start the recovery process again.");
        }
    }, [email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!email) {
            setError("Email is missing. Please restart the process.");
            return;
        }
        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetchPublic("/api/investor/auth/verify-otp", {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "OTP verification failed");
            }

            setMessage("OTP verified successfully!");
            // Proceed to reset password, passing email and OTP (needed for final reset)
            setTimeout(() => {
                navigate("/reset-password", { state: { email, otp } });
            }, 1000);

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
                        <h1 className="text-3xl font-bold mb-2">Verify Identity</h1>
                        <p className="text-blue-100">Enter the security code sent to your email.</p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Two-Factor Security</h3>
                                <p className="text-xs text-blue-100">Protecting your account access</p>
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
                        <h2 className="text-2xl font-bold text-gray-800">Enter OTP</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField
                            label="One-Time Password"
                            name="otp"
                            icon={Lock}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            error={error}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem' }}
                        />

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
                            {isSubmitting ? "Verifying..." : "Verify OTP"}
                            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Didn't receive the code?{" "}
                        <Link to="/forgot-password" className="text-blue-600 font-medium hover:underline">
                            Resend
                        </Link>
                    </p>

                    <div className="mt-8 text-center">
                        <Link to="/forgot-password" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
