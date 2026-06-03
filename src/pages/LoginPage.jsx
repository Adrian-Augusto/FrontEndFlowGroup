import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { OctopusIllustration } from "../components/OctopusIllustration";
import "./LoginPage.css";

export function LoginPage() {
  const { startGoogleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from ?? "/";

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const handleGoogleLogin = () => {
    setLoading(true);
    startGoogleLogin(from);
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <div className="login-page__visual">
          <OctopusIllustration className="login-page__octopus" />
        </div>

        <div className="login-page__content">
          <h1 className="login-page__title">Bem-vindo ao FlowGroup</h1>
          <p className="login-page__text">
            Organize suas comunidades de forma simples e eficiente. Faça login para continuar.
          </p>

          <GoogleSignInButton onClick={handleGoogleLogin} loading={loading} />

          <Link to="/" className="login-page__back">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
