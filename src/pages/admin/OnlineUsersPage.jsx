import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../api/axiosClient";
import "./OnlineUsersPage.css";

function formatNumber(n) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function OnlineUsersPage() {
  const [onlineData, setOnlineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOnlineUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/users/online");
      const onlineDataResult = data?.data || data;
      setOnlineData(onlineDataResult);
    } catch (err) {
      console.error("[OnlineUsersPage] Erro ao carregar dados:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnlineUsers();
  }, []);

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">⚙️</span>
          <h3 className="admin-sidebar__title">FlowGroup Admin</h3>
        </div>
        <nav className="admin-sidebar__nav">
          <Link to="/admin" className="admin-sidebar__link">
            🛡️ Moderação
          </Link>
          <Link to="/admin/online-users" className="admin-sidebar__link admin-sidebar__link--active">
            👥 Usuários Online
          </Link>
          <hr className="admin-sidebar__divider" />
          <Link to="/" className="admin-sidebar__link admin-sidebar__link--back">
            🏠 Voltar ao Site
          </Link>
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-content__header">
          <div>
            <p className="admin-content__eyebrow">Administração</p>
            <h1 className="admin-content__title">Usuários Online</h1>
            <p className="admin-content__subtitle">
              Visualize em tempo real quantos usuários estão ativos na plataforma.
            </p>
          </div>
          <button
            type="button"
            className="online-users__refresh"
            onClick={loadOnlineUsers}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </header>

        {loading ? (
          <div className="admin-loading-container">
            <p className="online-users__loading">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="admin-error-container">
            <p className="online-users__error">{error}</p>
          </div>
        ) : onlineData ? (
          <div className="online-users__content">
            <div className="online-users__card">
              <div className="online-users__icon">👥</div>
              <div className="online-users__info">
                <span className="online-users__label">Usuários Online</span>
                <strong className="online-users__value">{formatNumber(onlineData.onlineUsers)}</strong>
                <span className="online-users__hint">
                  Limite de tempo: {onlineData.threshold || "15 minutos"}
                </span>
                <span className="online-users__hint">
                  Última atualização: {new Date(onlineData.timestamp).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
