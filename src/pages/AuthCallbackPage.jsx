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
      // ── 1. Lê o token do hash (#token=... ou #access_token=...) ──
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hash);
      const token =
        hashParams.get("token") ||
        hashParams.get("accessToken") ||
        hashParams.get("access_token");

      // Também verifica query string como fallback (?token=...)
      const queryParams = new URLSearchParams(window.location.search);
      const queryToken =
        queryParams.get("token") ||
        queryParams.get("accessToken") ||
        queryParams.get("access_token");

      const finalToken = token || queryToken;

      // ── 2. Remove hash e query da URL IMEDIATAMENTE ───────────────
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      // ── 3. Verifica se há erro vindo do backend ───────────────────
      const errorParam =
        hashParams.get("error") || queryParams.get("error");

      if (errorParam) {
        navigate(`/login?error=${encodeURIComponent(errorParam)}`, {
          replace: true,
        });
        return;
      }

      // ── 4. Sem token → redireciona para login ─────────────────────
      if (!finalToken) {
        navigate("/login?error=auth_failed", { replace: true });
        return;
      }

      // ── 5. Valida formato JWT (3 partes) ──────────────────────────
      const parts = finalToken.split(".");
      if (parts.length !== 3) {
        navigate("/login?error=auth_failed", { replace: true });
        return;
      }

      // ── 6. Verifica expiração ─────────────────────────────────────
      try {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          navigate("/login?error=auth_failed", { replace: true });
          return;
        }
      } catch {
        navigate("/login?error=auth_failed", { replace: true });
        return;
      }

      try {
        // ── 7. Salva o token ───────────────────────────────────────
        localStorage.setItem("accessToken", finalToken);

        // ── 8. Busca perfil autenticado ────────────────────────────
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        // ── 9. Redireciona para home ───────────────────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });

      } catch (err) {
        console.error("[AuthCallbackPage] Erro:", err);
        localStorage.removeItem("accessToken");
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
