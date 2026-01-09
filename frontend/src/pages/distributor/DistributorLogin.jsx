// File: src/pages/distributor/DistributorLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

export default function DistributorLogin() {
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user && user.role === "distributor") {
      navigate("/distributor", { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!formData.userId) newErrors.userId = "Distributor ID or Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        await login(formData.userId, formData.password, "distributor");
        navigate("/distributor", { replace: true });
      } catch {
        setErrors({ form: "Login failed. Please check your credentials." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-600 text-center">
          Distributor Login
        </h2>

        {errors.form && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">Distributor ID / Email</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="Enter Distributor ID or Email"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.userId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
          </div>

          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="text-xs text-gray-500 italic">
            Note: If logging in from a new device, a verification step may be required.
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-semibold text-white transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Not registered?{" "}
          <Link to="/distributor/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-blue-600 cursor-pointer hover:underline">
          Forgot Password?
        </p>
      </div>
    </div>
  );
}
