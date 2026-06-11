import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLoginPage.css";

export function AdminLoginPage() {
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithCredentials(
        { email: email.trim(), password },
        { requireAdmin: true },
      );
    } catch (err) {
      setError(err?.message ?? "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <p className="admin-login__eyebrow">Área restrita</p>
        <h1 className="admin-login__title">Login administrativo</h1>

        {error && (
          <p className="admin-login__error" role="alert">
            {error}
          </p>
        )}

        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
          <label className="admin-login__label" htmlFor="admin-email">
            E-mail
          </label>
          <input
            id="admin-email"
            className="admin-login__input"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label className="admin-login__label" htmlFor="admin-password">
            Senha
          </label>
          <input
            id="admin-password"
            className="admin-login__input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <button type="submit" className="admin-login__submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <Link to="/" className="admin-login__back">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
