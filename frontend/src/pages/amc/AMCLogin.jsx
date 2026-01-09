import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

export default function AMCLogin() {
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    console.log("AMCLogin user:", user);
    if (user && user.role === "amc") {
      navigate("/amc", { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!formData.userId) newErrors.userId = "Official Email or PAN is required";
    else if (
      !emailRegex.test(formData.userId) &&
      !panRegex.test(formData.userId.toUpperCase())
    ) {
      newErrors.userId = "Enter a valid Email or PAN (e.g., AMCDE1234F)";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        console.log("Logging in:", formData.userId);
        await login(formData.userId, formData.password, "amc");
        console.log("Login successful, redirecting to /amc");
        navigate("/amc", { replace: true });
      } catch (error) {
        console.error("Login failed:", error);
        setErrors({ form: "Login failed. Please check your credentials." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">AMC Login</h2>

        {errors.form && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{errors.form}</div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email or PAN</label>
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="Enter official Email or PAN"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.userId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" disabled={loading} />
              Remember Me
            </label>
            <Link to="/amc/forgot-password" className="text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Not registered?{" "}
          <Link to="/amc/register" className="text-blue-600 hover:underline">Register as AMC</Link>
        </p>
      </div>
    </div>
  );
}
