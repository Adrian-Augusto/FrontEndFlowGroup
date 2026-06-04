import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { escapeHtml } from "../utils/securityValidators";
import "./AuthCallbackPage.css";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      // ── 1. Captura params ANTES de limpar a URL ──────────────────
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("code");
      const errorParam = params.get("error");

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

      if (!codeParam) {
        console.warn("[AuthCallbackPage] Código de autorização ausente.");
        navigate("/login?error=auth_failed", { replace: true });
        return;
      }

      try {
        // ── 4. Troca o código temporário pelo token JWT ─────────────
        const apiOrigin = import.meta.env.VITE_API_ORIGIN?.trim() || "https://allgrops.onrender.com";
        const EXCHANGE_URL = `${apiOrigin.replace(/\/$/, "")}/api/v1/auth/exchange-code`;

        console.log("[AuthCallbackPage] Trocando código temporário...");
        const res = await fetch(EXCHANGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ code: codeParam }),
        });

        if (!res.ok) {
          console.warn("[AuthCallbackPage] Falha na troca do código:", res.status);
          navigate("/login?error=auth_failed", { replace: true });
          return;
        }

        // Extrai o JSON e obtém o token retornado pelo backend
        const data = await res.json();
        const token = data?.accessToken ?? data?.token;
        if (!token) {
          throw new Error("Token não retornado pelo servidor.");
        }

        console.log("[AuthCallbackPage] Token recebido com sucesso.");
        const { authService } = await import("../auth/authService");
        authService.setAccessToken(token);

        // ── 5. Salva usuário no estado da aplicação ───────────────
        // refreshProfile busca /auth/google/profile novamente via Axios
        // e sincroniza o AuthContext (setUser, memoryUser, etc.)
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        console.log(
          "[AuthCallbackPage] ✓ Usuário autenticado com sucesso:",
          user
        );

        // ── 6. Redireciona para home ──────────────────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });
      } catch (err) {
        console.error("[AuthCallbackPage] Erro durante callback:", err);
        navigate("/login?error=auth_failed", { replace: true });
      }
    })();
  }, [navigate, refreshProfile]);

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