import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../auth/authService";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute component
 * 
 * Protects routes by requiring authentication and optionally admin role.
 * Features:
 * - Validates user is authenticated via AuthContext
 * - Checks authService state for consistency
 * - Requires admin role if specified
 * - Checks if user accepted terms
 * - Preserves intended path for redirect after login
 * - Shows loading state while checking authentication
 */
export function ProtectedRoute({ children, requireAdmin = false, requireTerms = true }) {
  const { loading, isAdmin, user } = useAuth();
  const location = useLocation();

  // While checking authentication status, show loading
  if (loading) {
    return (
      <div className="page-loading" role="status">
        Carregando…
      </div>
    );
  }

  // User not authenticated - redirect to login
  // Preserve the intended path so user can return after login
  if (!authService.isAuthenticated() || !user) {
    console.warn("[ProtectedRoute] User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User authenticated but terms not accepted - redirect to terms page
  if (requireTerms && !user.termos_aceitos && location.pathname !== "/termos") {
    console.warn("[ProtectedRoute] User has not accepted terms, redirecting to /termos");
    return <Navigate to="/termos" state={{ from: location.pathname }} replace />;
  }

  // User authenticated but admin required - redirect to home
  if (requireAdmin && !isAdmin) {
    console.warn("[ProtectedRoute] User is not admin, redirecting to home");
    return <Navigate to="/" replace />;
  }

  // All checks passed - render protected content
  return children;
}
