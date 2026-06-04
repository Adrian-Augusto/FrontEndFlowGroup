import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../auth/authService";
import { escapeHtml } from "../utils/securityValidators";
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
      // ── 1. Captura params ANTES de limpar a URL ──────────────────
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      const tokenParam = params.get("token");

      // ── 1.5. Se backend enviou token na query, armazena em sessionStorage ─
      if (tokenParam) {
        console.log("[AuthCallbackPage] Token recebido do backend via query param");
        authService.setAccessToken(tokenParam);
      }

      // ── 2. Limpa a URL imediatamente (segurança) ─────────────────
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      // ── 3. Verifica erro vindo do backend ────────────────────────
      if (errorParam) {
        // Sanitize error message to prevent XSS in URL
        const sanitizedError = escapeHtml(errorParam).substring(0, 100);
        console.warn("[AuthCallbackPage] OAuth error:", sanitizedError);
        navigate(`/login?error=${encodeURIComponent(sanitizedError)}`, {
          replace: true,
        });
        return;
      }

      try {
        // ── 4. Busca perfil via cookie HttpOnly ou Bearer token ──
        // refreshProfile agora retorna o usuário e armazena token automaticamente
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        console.log("[AuthCallbackPage] ✓ Usuário autenticado com sucesso:", user);

        // ── 5. Redireciona para home ─────────────────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });

      } catch (err) {
        console.error("[AuthCallbackPage] Erro durante callback:", err);
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