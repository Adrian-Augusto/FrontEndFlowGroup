import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { termsApi } from "../api/termsApi";
import "./LoginSuccessPage.css";

export function LoginSuccessPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token") || params.get("accessToken");
        if (token) {
          localStorage.setItem("accessToken", token);
        }

        // 1. Refresh profile
        console.log("[LoginSuccessPage] Buscando perfil do usuário...");
        const user = await refreshProfile();
        console.log("[LoginSuccessPage] Perfil obtido:", user);

        if (!user) {
          throw new Error("Não foi possível obter perfil do usuário");
        }

        // 2. Verificar se termos foram aceitos
        console.log("[LoginSuccessPage] Verificando status dos termos...");
        try {
          if (user.termos_aceitos === true) {
            console.log("[LoginSuccessPage] ✅ Termos já foram aceitos (no perfil do usuário)! Redirecionando para home");
            navigate("/", { replace: true, state: { focusGrupos: true } });
            return;
          }

          const termsStatus = await termsApi.getStatus();
          console.log("[LoginSuccessPage] ===== STATUS RETORNADO =====");
          console.log("[LoginSuccessPage] Resposta bruta:", termsStatus?.rawData);
          console.log("[LoginSuccessPage] accepted (final):", termsStatus?.accepted);
          console.log("[LoginSuccessPage] Tipo de accepted:", typeof termsStatus?.accepted);
          console.log("[LoginSuccessPage] ============================");

          // Se termos foram aceitos, vai para home
          if (termsStatus?.accepted === true) {
            console.log("[LoginSuccessPage] ✅ Termos já foram aceitos! Redirecionando para home");
            navigate("/", { replace: true, state: { focusGrupos: true } });
            return;
          } else {
            console.log("[LoginSuccessPage] ❌ Termos NÃO foram aceitos, redirecionando para /termos");
            navigate("/termos", { replace: true });
            return;
          }
        } catch (err) {
          // Se falhar ao verificar, continua (fallback)
          console.warn("[LoginSuccessPage] Erro ao verificar termos:", err);
        }

        // 3. Termos ok - redirecionar para home
        console.log("[LoginSuccessPage] Tudo certo, redirecionando para home");
        navigate("/", { replace: true, state: { focusGrupos: true } });
      } catch (err) {
        console.error("[LoginSuccessPage] Erro:", err);
        setError("Não foi possível iniciar a sessão.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    })();
  }, [navigate, refreshProfile]);

  if (error) {
    return (
      <div className="login-success">
        <p className="login-success__error">{error}</p>
      </div>
    );
  }

  return (
    <div className="login-success">
      <p className="login-success__loading" role="status">
        Entrando…
      </p>
    </div>
  );
}
