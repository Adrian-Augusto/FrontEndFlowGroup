import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthCallbackPage.css";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      // ── 1. Remove qualquer token da URL IMEDIATAMENTE (segurança) ──
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      // ── 2. Verifica se há erro vindo do backend ───────────────────
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");

      if (errorParam) {
        navigate(`/login?error=${encodeURIComponent(errorParam)}`, {
          replace: true,
        });
        return;
      }

      try {
        // ── 3. Busca perfil usando cookie HttpOnly (NÃO token da URL) ──
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        // ── 4. Redireciona para home ───────────────────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });

      } catch (err) {
        console.error("[AuthCallbackPage] Erro:", err);
        setStatus("error");
        setErrorMsg("Não foi possível concluir o login. Tente novamente.");
        setTimeout(() => {
          navigate("/login?error=auth_failed", { replace: true });
        }, 2500);
      }
    })();
  }, [navigate, refreshProfile]);

  // ── UI ──────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="auth-callback">
        <div className="auth-callback__error-box">
          <span className="auth-callback__error-icon">⚠️</span>
          <p className="auth-callback__error">{errorMsg}</p>
          <p className="auth-callback__redirect-msg">
            Redirecionando para o login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback">
      <div className="auth-callback__loading-box">
        <div className="auth-callback__spinner" aria-hidden="true" />
        <p className="auth-callback__loading" role="status" aria-live="polite">
          Concluindo login…
        </p>
      </div>
    </div>
  );
}
