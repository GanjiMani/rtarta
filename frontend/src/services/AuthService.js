// services/AuthService.js
export function logout() {
  // Clear login state
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("isAdmin"); 
  // Redirect to login
  window.location.href = "/login";
}
