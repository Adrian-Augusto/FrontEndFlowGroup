import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthCallbackPage.css";

export function AuthCallbackPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token") || searchParams.get("accessToken");

    // ⚠️ Remove token da URL IMEDIATAMENTE
    if (searchParams.has("token") || searchParams.has("accessToken")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token) {
      localStorage.setItem("accessToken", token);
    }

    // Se vier imagem do Google no callback da URL, guarda no localStorage
    const queryAvatar =
      searchParams.get("profileImage") ||
      searchParams.get("profile_image") ||
      searchParams.get("avatarUrl") ||
      searchParams.get("avatar_url") ||
      searchParams.get("avatar") ||
      searchParams.get("picture") ||
      searchParams.get("photo");

    if (queryAvatar) {
      localStorage.setItem("userAvatar", queryAvatar);
    }

    const next = searchParams.get("next") || "/";
    const err = searchParams.get("error");

    if (err) {
      setError(decodeURIComponent(err));
      return;
    }

    refreshProfile()
      .then((user) => {
        if (user) navigate(next, { replace: true });
        else setError("Sessão não encontrada. Tente entrar novamente.");
      })
      .catch((e) => {
        setError(e?.message ?? "Falha ao carregar perfil.");
      });
  }, [refreshProfile, navigate, searchParams]);

  return (
    <div className="auth-callback">
      {error ? (
        <>
          <p className="auth-callback__error">{error}</p>
          <a href="/login">Voltar ao login</a>
        </>
      ) : (
        <p className="auth-callback__loading" role="status">
          Concluindo login…
        </p>
      )}
    </div>
  );
}
