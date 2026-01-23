import { Navigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false, amcOnly = false, distributorOnly = false, sebiOnly = false }) {
  const { user, loading } = useAuth();

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = Boolean(user);
  const role = user?.role || null;

  // 1. Session Restoration Check
  if (!isLoggedIn && localStorage.getItem("token") && localStorage.getItem("user")) {
    // AuthContext is likely still initializing in inconsistent state
    // Returning null or spinner prevents premature redirect
    return null;
  }

  // 2. Not Logged In checks
  if (!isLoggedIn) {
    if (adminOnly) return <Navigate to="/admin/login" replace />;
    if (amcOnly) return <Navigate to="/amc/login" replace />;
    if (distributorOnly) return <Navigate to="/distributor/login" replace />;
    if (sebiOnly) return <Navigate to="/sebi/login" replace />;
    return <Navigate to="/login" replace />;
  }

  // Define authorized roles for Admin
  // "admin" is the generic DB role, "RTA CEO" might be passed in some contexts, keeping both for safety
  const adminRoles = ["admin", "RTA CEO", "superadmin"];

  // 3. Admin Route Logic
  if (adminOnly) {
    if (adminRoles.includes(role)) {
      return children;
    }
    // Logged in but not admin? Redirect to their home or show unauthorized
    return <Navigate to="/login" replace />;
  }

  // 4. AMC Route Logic
  if (amcOnly) {
    if (role === "amc") return children;
    return <Navigate to="/amc/login" replace />;
  }

  // 5. Distributor Route Logic
  if (distributorOnly) {
    if (role === "distributor") return children;
    return <Navigate to="/distributor/login" replace />;
  }

  // 6. SEBI Route Logic
  if (sebiOnly) {
    if (role === "sebi") return children;
    return <Navigate to="/sebi/login" replace />;
  }

  // 7. Standard/Investor Route Logic (No specific flag passed)
  // If an Admin/AMC tries to access standard investor routes, redirect to their dashboard
  if (adminRoles.includes(role)) {
    return <Navigate to="/admin/admindashboard" replace />;
  }
  if (role === "amc") {
    return <Navigate to="/amc" replace />;
  }
  if (role === "distributor") {
    return <Navigate to="/distributor" replace />;
  }
  if (role === "sebi") {
    return <Navigate to="/sebi" replace />;
  }

  // Default: Return children (Investor/User)
  return children;
}
