import { Navigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false, amcOnly = false }) {
  const { user, loading } = useAuth();

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = Boolean(user);
  const role = user?.role || null;

  // If we have stored auth data but user is not set yet, wait a bit more
  // This handles the case where auth initialization is still processing
  if (!isLoggedIn && localStorage.getItem("token") && localStorage.getItem("user")) {
    console.log("Auth data exists in localStorage but user not set, showing loading");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  const adminRoles = new Set(["admin", "RTA CEO"]);

  if (!isLoggedIn) {
    if (adminOnly) return <Navigate to="/admin/login" replace />;
    if (amcOnly) return <Navigate to="/amc/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if ((adminOnly || amcOnly) && (role === "investor" || role === "user")) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !adminRoles.has(role)) {
    return <Navigate to="/admin/login" replace />;
  }

  if (amcOnly && role !== "amc") {
    return <Navigate to="/amc/login" replace />;
  }

  if (!adminOnly && !amcOnly) {
    if (adminRoles.has(role)) {
      return <Navigate to="/admin/admindashboard" replace />;
    }
    if (role === "amc") {
      return <Navigate to="/amc" replace />;
    }
    if (role === "investor" || role === "user") {
      return children;
    }
  }

  return <Navigate to="/" replace />;
}
