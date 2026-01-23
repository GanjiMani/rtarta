import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          try {
            // Parse stored user data
            const userData = JSON.parse(storedUser);

            // For now, trust the stored token and user data
            // Only validate if we get a definitive 401 response
            console.log("Found stored auth data, trusting it initially");

            // Set the user data immediately
            if (!userData.role) {
              userData.role = "investor";
            }
            setUser(userData);
            setToken(storedToken);

            // Optionally validate the token in the background (don't block on it)
            // This prevents logout on temporary network issues
            setTimeout(async () => {
              try {
                const profileEndpoint = userData.role === 'admin'
                  ? "/api/admin/auth/me"
                  : "/api/investor/profile";

                const response = await fetch(`${API_URL}${profileEndpoint}`, {
                  headers: {
                    Authorization: `Bearer ${storedToken}`,
                  },
                });

                // Only clear auth if we get a definitive 401 (unauthorized)
                if (response.status === 401) {
                  console.log("Token is invalid (401), clearing auth");
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setUser(null);
                  setToken(null);
                  // Redirect to login if currently on a protected page
                  if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                    window.location.href = '/login';
                  }
                }
                // For other errors (network issues, server errors), keep the user logged in
              } catch (validationError) {
                console.log("Token validation failed (network/server issue), keeping user logged in");
                // Don't clear auth data on network errors
              }
            }, 1000); // Small delay to not block initial render

          } catch (parseError) {
            console.error("Error parsing stored user data:", parseError);
            // If we can't parse the stored data, clear it
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setToken(null);
          }
        } else {
          // No stored auth data
          setUser(null);
          setToken(null);
        }
      } catch (outerError) {
        console.error("Auth initialization error:", outerError);
        // Clear any potentially corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        // Always set loading to false after initialization
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);
  async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("token");
    console.log("fetchWithAuth token:", !!token ? "present" : "missing");

    if (!token) {
      console.log("No token available, cannot make authenticated request");
      throw new Error("No authentication token available");
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    const opts = { ...options, headers };

    // Prepend API_URL to the URL to call backend correctly
    const res = await fetch(API_URL + url, opts);

    // Only logout on 401, but be more careful about when to do this
    if (res.status === 401) {
      console.log("Received 401 Unauthorized, clearing auth data");
      logout();
      throw new Error("Unauthorized");
    }
    return res;
  }

  async function register(payload, isAdmin = false) {
    setLoading(true);
    try {
      // Pick the correct endpoint
      const endpoint = isAdmin ? "/api/admin/auth/register" : "/api/investor/auth/register";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join(", ");
          throw new Error(messages);
        } else {
          throw new Error(errorData.detail || "Registration failed");
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Register error", error);
      throw error;
    }
  }
  async function login(email, password, isAdmin = false) {
    setLoading(true);
    setError(null);

    const payload = { email, password };
    const loginEndpoint = isAdmin ? "/api/admin/auth/login" : "/api/investor/auth/login";
    const profileEndpoint = isAdmin ? "/api/admin/auth/me" : "/api/investor/profile/";

    try {
      const response = await fetch(`${API_URL}${loginEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const responseData = await response.json();
      const data = responseData.data || responseData; // Handle nested response structure

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);

      if (!data.access_token || data.access_token.length < 10) {
        throw new Error("Invalid token received");
      }
      console.log("Sending token:", data.access_token);
      console.log("Profile endpoint:", `${API_URL}${profileEndpoint}`);
      const profileResponse = await fetch(`${API_URL}${profileEndpoint}`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      console.log("Profile response status:", profileResponse.status);

      if (!profileResponse.ok) {
        const resText = await profileResponse.text();
        console.error("Profile fetch failed:", resText);
        throw new Error(`Failed to fetch profile: ${resText}`);
      }

      const profileResponseData = await profileResponse.json();
      const profileData = profileResponseData.data || profileResponseData;

      // Handle nested user data structure
      const userData = profileData.user || profileData;

      if (!userData.role) {
        userData.role = "investor"; // fallback role
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      navigate(isAdmin ? "/admin/admindashboard" : "/investor");
      setLoading(false);
      return profileData;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }



  function logout() {
    console.log("Logging out user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    // Navigate to home instead of login to avoid redirect loops
    navigate("/");
  }

  async function fetchPublic(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const opts = { ...options, headers };

    // Prepend API_URL to the URL
    const res = await fetch(API_URL + url, opts);
    return res;
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      fetchWithAuth,
      fetchPublic,
      fetchWithoutAuth: fetchPublic,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
