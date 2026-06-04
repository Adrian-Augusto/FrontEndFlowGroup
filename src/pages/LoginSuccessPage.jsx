import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginSuccessPage.css";

export function LoginSuccessPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      // ── 1. Captura o token ANTES de limpar a URL ─────────────────
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      // ── 2. Limpa a URL imediatamente (segurança) ──────────────────
      window.history.replaceState({}, document.title, window.location.pathname);

      // ── 3. Valida token ───────────────────────────────────────────
      if (!token) {
        navigate("/login?error=missing_token", { replace: true });
        return;
      }

      // ── 4. Salva token no localStorage ────────────────────────────
      localStorage.setItem("accessToken", token);

      try {
        // ── 5. Busca perfil (agora o interceptor já tem o Bearer) ───
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        // ── 6. Redireciona para home ──────────────────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });

      } catch (err) {
        console.error("[LoginSuccessPage] Erro:", err);
        localStorage.removeItem("accessToken"); // limpa token inválido
        setStatus("error");
        setErrorMsg("Não foi possível autenticar. Tente novamente.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2500);
      }
    })();
  }, [navigate, refreshProfile]);

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