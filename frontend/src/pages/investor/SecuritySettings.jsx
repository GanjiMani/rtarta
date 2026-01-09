import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function SecuritySettings() {
  const { fetchWithAuth } = useAuth();
  const [passwords, setPasswords] = useState({ 
    current: "", 
    newPass: "", 
    confirm: "" 
  });
  const [showPassword, setShowPassword] = useState({ 
    current: false, 
    newPass: false, 
    confirm: false 
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordStrengthColor, setPasswordStrengthColor] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Calculate password strength
  useEffect(() => {
    if (!passwords.newPass) {
      setPasswordStrength("");
      setPasswordStrengthColor("");
      return;
    }

    let strength = 0;
    let strengthText = "";
    let color = "";

    // Check length
    if (passwords.newPass.length >= 8) strength++;
    if (passwords.newPass.length >= 12) strength++;

    // Check for uppercase
    if (/[A-Z]/.test(passwords.newPass)) strength++;

    // Check for lowercase
    if (/[a-z]/.test(passwords.newPass)) strength++;

    // Check for numbers
    if (/[0-9]/.test(passwords.newPass)) strength++;

    // Check for special characters
    if (/[^A-Za-z0-9]/.test(passwords.newPass)) strength++;

    // Determine strength text and color
    if (strength <= 2) {
      strengthText = "Weak";
      color = "text-red-600";
    } else if (strength <= 4) {
      strengthText = "Medium";
      color = "text-yellow-600";
    } else {
      strengthText = "Strong";
      color = "text-green-600";
    }

    setPasswordStrength(strengthText);
    setPasswordStrengthColor(color);
  }, [passwords.newPass]);

  const validatePassword = () => {
    if (!passwords.current) {
      setError("Please enter your current password");
      setSuccessMsg("");
      return false;
    }

    if (!passwords.newPass) {
      setError("Please enter a new password");
      setSuccessMsg("");
      return false;
    }

    if (passwords.newPass.length < 8) {
      setError("New password must be at least 8 characters long");
      setSuccessMsg("");
      return false;
    }

    if (passwords.newPass === passwords.current) {
      setError("New password must be different from current password");
      setSuccessMsg("");
      return false;
    }

    if (passwords.newPass !== passwords.confirm) {
      setError("New passwords do not match");
      setSuccessMsg("");
      return false;
    }

    return true;
  };

  const changePassword = async (e) => {
    e?.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setIsChangingPassword(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetchWithAuth(`/api/investor/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.newPass,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to change password" }));
        throw new Error(errData.detail || "Failed to change password");
      }

      const result = await res.json();
      setSuccessMsg("Password changed successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
      setPasswords({ current: "", newPass: "", confirm: "" });
      setPasswordStrength("");
      setPasswordStrengthColor("");
    } catch (err) {
      setError(err.message || "An error occurred while changing password");
      setSuccessMsg("");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-gray-600 mt-1">Manage your account security and password</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMsg}
          </div>
        )}

        {/* Change Password Section */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h3>
            <p className="text-sm text-gray-600">
              Update your password regularly to keep your account secure
            </p>
          </div>

          <form onSubmit={changePassword} className="p-6">
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-800"
                    onClick={() => togglePasswordVisibility("current")}
                    tabIndex={-1}
                  >
                    {showPassword.current ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-6 0-9-7-9-7a18.176 18.176 0 013.838-5.707"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2 2l20 20"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.newPass ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-800"
                    onClick={() => togglePasswordVisibility("newPass")}
                    tabIndex={-1}
                  >
                    {showPassword.newPass ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-6 0-9-7-9-7a18.176 18.176 0 013.838-5.707"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2 2l20 20"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {passwords.newPass && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${passwordStrengthColor}`}>
                        {passwordStrength}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      passwords.confirm && passwords.newPass !== passwords.confirm
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-800"
                    onClick={() => togglePasswordVisibility("confirm")}
                    tabIndex={-1}
                  >
                    {showPassword.confirm ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-6 0-9-7-9-7a18.176 18.176 0 013.838-5.707"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2 2l20 20"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {passwords.confirm && passwords.newPass !== passwords.confirm && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
                {passwords.confirm && passwords.newPass === passwords.confirm && (
                  <p className="text-xs text-green-600 mt-1">Passwords match</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? "Changing Password..." : "Change Password"}
              </button>
              {(passwords.current || passwords.newPass || passwords.confirm) && (
                <button
                  type="button"
                  onClick={() => {
                    setPasswords({ current: "", newPass: "", confirm: "" });
                    setError("");
                    setSuccessMsg("");
                    setPasswordStrength("");
                    setPasswordStrengthColor("");
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Security Tips Section */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Tips</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Use a strong, unique password
                  </p>
                  <p className="text-sm text-gray-600">
                    Include a mix of uppercase, lowercase, numbers, and special characters
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Don't reuse passwords
                  </p>
                  <p className="text-sm text-gray-600">
                    Use different passwords for different accounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Change your password regularly
                  </p>
                  <p className="text-sm text-gray-600">
                    Update your password every 90 days for better security
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Never share your password
                  </p>
                  <p className="text-sm text-gray-600">
                    Keep your password confidential and never share it with anyone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}