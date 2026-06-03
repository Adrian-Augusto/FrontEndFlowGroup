import { Outlet } from "react-router-dom";
import { authService } from "../auth/authService";
import { useAuth } from "../context/AuthContext";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminPage } from "../pages/AdminPage";

export function AdminRoute() {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="page-loading" role="status">
        Carregando…
      </div>
    );
  }

  if (!authService.isAuthenticated() || !isAdmin) {
    return <AdminLoginPage />;
  }

  return <Outlet />;
}
