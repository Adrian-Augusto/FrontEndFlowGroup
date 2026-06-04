import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginSuccessPage.css";

export function LoginSuccessPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      // ── 1. Captura do token ──────────────────────────────────────
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || params.get("accessToken");

      // ── 2. Remove da URL IMEDIATAMENTE (antes de qualquer await) ──
      window.history.replaceState({}, document.title, window.location.pathname);

      // ── 3. Validação inicial ──────────────────────────────────────
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      // Validação básica do formato JWT (3 partes separadas por ponto)
      const parts = token.split(".");
      if (parts.length !== 3) {
        navigate("/login", { replace: true });
        return;
      }

      // Verificar expiração do token
      try {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          navigate("/login", { replace: true });
          return;
        }
      } catch {
        navigate("/login", { replace: true });
        return;
      }

      try {
        // ── 4. Armazena o token ───────────────────────────────────
        localStorage.setItem("accessToken", token);

        // ── 5. Busca perfil autenticado ───────────────────────────
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        // ── 6. Redireciona para área autenticada ──────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });

      } catch (err) {
        // ── 7. Tratamento de erro ─────────────────────────────────
        console.error("[LoginSuccessPage] Erro ao processar autenticação:", err);

        // Limpa dados inválidos
        localStorage.removeItem("accessToken");

        setStatus("error");
        setErrorMsg("Não foi possível autenticar. Tente novamente.");

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2500);
      }
    })();
  }, [navigate, refreshProfile]);

  // ── UI ─────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="login-success">
        <div className="login-success__error-box">
          <span className="login-success__error-icon">⚠️</span>
          <p className="login-success__error">{errorMsg}</p>
          <p className="login-success__redirect-msg">Redirecionando para o login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-success">
      <div className="login-success__loading-box">
        <div className="login-success__spinner" aria-hidden="true" />
        <p className="login-success__loading" role="status" aria-live="polite">
          Autenticando…
        </p>
      </div>
    </div>
  );
}
