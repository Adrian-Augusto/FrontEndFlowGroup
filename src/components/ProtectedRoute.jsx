import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../auth/authService";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-loading" role="status">
        Carregando…
      </div>
    );
  }

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
