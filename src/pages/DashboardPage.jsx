import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardPage.css";

function UserAvatar({ user }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className="dashboard__avatar"
        width={80}
        height={80}
      />
    );
  }
  return (
    <span className="dashboard__avatar dashboard__avatar--fallback" aria-hidden="true">
      {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
    </span>
  );
}

export function DashboardPage() {
  const { user, loading, refreshProfile } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    refreshProfile().finally(() => setProfileLoading(false));
  }, [refreshProfile]);

  if (loading || profileLoading) {
    return (
      <div className="dashboard">
        <p className="dashboard__loading" role="status">
          Carregando seu perfil…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard">
        <p className="dashboard__error">Não foi possível carregar o perfil.</p>
        <Link to="/login" className="dashboard__link">
          Fazer login novamente
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <UserAvatar user={user} />
        <div>
          <h1 className="dashboard__title">Olá, {user.name ?? "usuário"}</h1>
          <p className="dashboard__subtitle">Sua conta FlowGroup</p>
        </div>
      </header>

      <section className="dashboard__card" aria-labelledby="dashboard-info-title">
        <h2 id="dashboard-info-title" className="dashboard__card-title">
          Informações da conta
        </h2>
        <dl className="dashboard__dl">
          <div className="dashboard__row">
            <dt>Nome</dt>
            <dd>{user.name ?? "—"}</dd>
          </div>
          <div className="dashboard__row">
            <dt>E-mail</dt>
            <dd>{user.email ?? "—"}</dd>
          </div>
          <div className="dashboard__row">
            <dt>Perfil</dt>
            <dd>
              <span className={`dashboard__badge dashboard__badge--${user.role ?? "user"}`}>
                {user.role?.toUpperCase() === "ADMIN" ? "Administrador" : "Usuário"}
              </span>
            </dd>
          </div>
          {user.id && (
            <div className="dashboard__row">
              <dt>ID</dt>
              <dd className="dashboard__mono">{user.id}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="dashboard__actions">
        <Link to="/" className="dashboard__btn dashboard__btn--primary">
          Ver grupos
        </Link>
        {user.role?.toUpperCase() === "ADMIN" && (
          <Link to="/admin" className="dashboard__btn dashboard__btn--secondary">
            Painel admin
          </Link>
        )}
      </div>
    </div>
  );
}
