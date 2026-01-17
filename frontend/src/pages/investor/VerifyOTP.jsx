import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import {
    Lock,
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
            setError("Email not found. Please start recovery again.");
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

            setMessage("Verified!");
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md p-8 border border-gray-100 shadow-sm rounded-2xl">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Enter the code sent to <span className="font-semibold text-gray-900">{email}</span>
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
                        placeholder="000000"
                        maxLength={6}
                        style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                    />

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
                        {isSubmitting ? "Verifying..." : "Verify OTP"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/forgot-password" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Resend
                    </Link>
                </div>
            </div>
        </div>
    );
}
