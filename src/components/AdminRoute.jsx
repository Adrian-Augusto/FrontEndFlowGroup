import { Outlet } from "react-router-dom";
import { authService } from "../auth/authService";
import { useAuth } from "../context/AuthContext";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminPage } from "../pages/AdminPage";

/**
 * AdminRoute component
 * 
 * Protects admin routes by requiring authentication and admin role.
 * Features:
 * - Validates user is authenticated
 * - Validates user has admin role
 * - Shows login page if not authenticated or not admin
 * - Shows loading state while checking authentication
 */
export function AdminRoute() {
  const { loading, isAdmin, user } = useAuth();

  // While checking authentication status, show loading
  if (loading) {
    return (
      <div className="page-loading" role="status">
        Carregando…
      </div>
    );
  }

  // User not authenticated or not admin - show admin login page
  if (!authService.isAuthenticated() || !user || !isAdmin) {
    console.warn("[AdminRoute] Access denied - showing admin login page");
    return <AdminLoginPage />;
  }

  // All checks passed - render admin routes
  return <Outlet />;
}
