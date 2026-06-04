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
      // ── 1. Remove qualquer token da URL IMEDIATAMENTE (segurança) ──
      window.history.replaceState({}, document.title, window.location.pathname);

      try {
        // ── 2. Busca perfil usando cookie HttpOnly (NÃO token da URL) ──
        const user = await refreshProfile();

        if (!user) {
          throw new Error("Perfil não encontrado após autenticação.");
        }

        console.log("[LoginSuccessPage] Autenticação concluída com sucesso");

        // ── 3. Redireciona para área autenticada ──────────────────
        navigate("/", { replace: true, state: { focusGrupos: true } });

      } catch (err) {
        // ── 4. Tratamento de erro ─────────────────────────────────
        console.error("[LoginSuccessPage] Erro ao processar autenticação:", err);

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