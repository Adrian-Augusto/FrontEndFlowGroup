import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDisplayName } from "../utils/displayUserName";
import "./Header.css";

/**
 * User avatar component
 * Shows user's avatar image if available, otherwise shows first letter of name
 * Avatar URL is sanitized during user normalization to prevent XSS
 */
function UserAvatar({ user }) {
  const label = getDisplayName(user);
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className="header__avatar"
        width={36}
        height={36}
        referrerPolicy="no-referrer"
        decoding="async"
      />
    );
  }
  return (
    <span className="header__avatar header__avatar--fallback" aria-hidden="true">
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const displayName = getDisplayName(user);

  const handleLogout = async () => {
    // Logout removes token from sessionStorage and calls backend
    // Backend clears HttpOnly cookie
    // AuthContext updates state to null
    await logout();
  };

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand" aria-label="FlowGroup — início">
          <span className="header__logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <circle cx="16" cy="14" r="5" fill="#fff" />
              <path
                d="M9 21c2-2.5 4.5-3.5 7-3.5s5 1 7 3.5"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="header__name">FlowGroup</span>
        </Link>

        <nav className="header__nav" aria-label="Principal">
          <NavLink
            to="/#destaques"
            className="header__link"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                document.getElementById("destaques")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            Destaques
          </NavLink>
          <NavLink to="/planos" className="header__link">
            Planos
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/meus-grupos" className="header__link header__link--muted">
                Meus grupos
              </NavLink>
              <NavLink to="/perfil" className="header__link header__link--muted">
                Perfil
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="header__link header__link--admin">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="header__actions">
          {isAuthenticated ? (
            <>
              <Link to="/perfil" className="header__profile-link" title="Ver perfil">
                <UserAvatar user={user} />
                <span className="header__user-name">{displayName}</span>
              </Link>
              <button 
                type="button" 
                className="header__logout" 
                onClick={handleLogout}
                title="Fazer logout e limpar sessão"
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="header__login-btn">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
