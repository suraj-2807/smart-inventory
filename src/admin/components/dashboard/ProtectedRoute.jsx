import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role = "admin" }) {
  const isAuthenticated = () => {
    if (role === "admin") {
      const adminAuth = localStorage.getItem("adminAuth");
      if (!adminAuth) return false;
      try {
        const authData = JSON.parse(adminAuth);
        return authData.username === "admin";
      } catch {
        return false;
      }
    }

    if (role === "staff") {
      const staffAuth = localStorage.getItem("staffAuth");
      if (!staffAuth) return false;
      try {
        const authData = JSON.parse(staffAuth);
        return authData.username === "staff";
      } catch {
        return false;
      }
    }

    if (role === "delivery") {
      const deliveryAuth = localStorage.getItem("deliveryAuth");
      if (!deliveryAuth) return false;
      try {
        const authData = JSON.parse(deliveryAuth);
        return authData.username === "delivery";
      } catch {
        return false;
      }
    }

    return false;
  };

  const getLoginPath = () => {
    if (role === "staff") return "/staff/login";
    if (role === "delivery") return "/delivery/login";
    return "/admin/login";
  };

  if (!isAuthenticated()) {
    return <Navigate to={getLoginPath()} replace />;
  }

  return children;
}
