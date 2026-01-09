// File: src/pages/sebi/SEBILogin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

export default function SEBILogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user && user.role === "sebi") {
      navigate("/sebi", { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) newErrors.email = "Official Email is required";
    else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid SEBI official email address";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        await login(formData.email, formData.password, "sebi");
        navigate("/sebi", { replace: true });
      } catch (error) {
        setErrors({ form: "Login failed. Please check your credentials." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <div className="mb-4 flex flex-col items-center">
          <svg width="50" height="50" className="mb-2" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#B91C1C" />
            <text x="12" y="16" fontSize="10" fill="#fff" textAnchor="middle">SEBI</text>
          </svg>
          <h2 className="text-2xl font-bold text-center text-red-700">SEBI Portal Login</h2>
          <p className="text-xs text-gray-500 text-center mt-1">
            Restricted Access. For SEBI Authorised Users Only.
          </p>
        </div>
        {errors.form && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{errors.form}</div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter SEBI official email"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-600 focus:outline-none ${errors.email ? "border-red-500" : "border-gray-300"}`}
              autoFocus
              disabled={loading}
              autoComplete="username"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-red-600 focus:outline-none ${errors.password ? "border-red-500" : "border-gray-300"}`}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" disabled={loading} />
              Remember Me
            </label>
            <span className="text-gray-400 italic cursor-not-allowed">Forgot Password?</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-800 transition ${loading ? "bg-red-400 cursor-not-allowed" : ""}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-xs text-gray-500 text-center">
          <b>Security Notice:</b> All logins are monitored. For access issues, contact SEBI IT, not the RTA.
        </div>
      </div>
    </div>
  );
}
