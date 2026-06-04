import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { escapeHtml } from "../utils/securityValidators";
import "./AuthCallbackPage.css";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      // ── 1. Captura params ANTES de limpar a URL ──────────────────
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      const code = params.get("code");

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
        if (!code) {
          throw new Error("Código de autenticação (code) ausente na URL.");
        }

        console.log("[AuthCallbackPage] Validando código de autenticação do Google...");
        
        // Chamada ao AuthContext para enviar o code ao backend e sincronizar dados
        await loginWithGoogle(code);

        console.log("[AuthCallbackPage] ✓ Usuário autenticado e sincronizado com sucesso.");

        // ── 4. Redireciona para home ──────────────────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });
      } catch (err) {
        console.error("[AuthCallbackPage] Erro durante callback:", err);
        navigate("/login?error=auth_failed", { replace: true });
      }
    })();
  }, [navigate, loginWithGoogle]);

  // ── UI: spinner enquanto valida ─────────────────────────────────────
  if (status === "error") {
    return (
      <div className="auth-callback">
        <div className="auth-callback__error-box">
          <span className="auth-callback__error-icon">⚠️</span>
          <p className="auth-callback__error">
            Não foi possível concluir o login. Tente novamente.
          </p>
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