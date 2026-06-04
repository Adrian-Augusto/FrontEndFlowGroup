import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../auth/authService";
import { termsApi } from "../api/termsApi";
import { AUTH_LOGOUT_EVENT } from "../api/axiosClient";
import { getGoogleLoginUrl } from "../api/routes";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const syncUser = useCallback((nextUser) => {
    if (!nextUser) {
      setUser(null);
      return;
    }
    setUser(nextUser);
    setProfileError(null);
    authService.setUser(nextUser);
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfileError(null);

    try {
      const response = await authService.getCurrentUser();
      if (response?.user) {
        syncUser(response.user);
        // Armazena token se disponível
        if (response.token) {
          authService.setAccessToken(response.token);
        }
        return response.user;
      }
      setUser(null);
      setProfileError("Sessão expirada ou inválida.");
      return null;
    } catch (err) {
      setUser(null);
      setProfileError(err?.message ?? "Erro ao buscar perfil.");
      return null;
    }
  }, [syncUser]);

  useEffect(() => {
    refreshProfile()
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [refreshProfile]);

  // Listen for logout events (triggered by 401/403 responses from API)
  useEffect(() => {
    const onLogout = () => {
      console.log("[AuthContext] Logout event received - clearing session");
      authService.clearSession();
      setUser(null);
      setProfileError(null);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const startGoogleLogin = useCallback((returnPath = "/") => {
    const loginUrl = getGoogleLoginUrl(returnPath);
    console.log("[AuthContext] Starting Google OAuth flow");
    window.location.href = loginUrl;
  }, []);

  const loginWithCredentials = useCallback(
    async ({ email, password }, { requireAdmin = false } = {}) => {
      const loginUser = await authService.login(email, password);
      syncUser(loginUser);

      if (requireAdmin && loginUser?.role?.toUpperCase() !== "ADMIN") {
        await authService.logout();
        setUser(null);
        throw new Error("Esta conta não tem permissão de administrador.");
      }

      return loginUser;
    },
    [syncUser],
  );

  const logout = useCallback(async () => {
    console.log("[AuthContext] User-initiated logout");
    await authService.logout();
    setUser(null);
    setProfileError(null);
  }, []);

  const acceptTerms = useCallback(async () => {
    try {
      await termsApi.acceptTerms();

      // Atualizar usuário localmente com termos aceitos
      const updatedUser = { ...user, termos_aceitos: true };
      syncUser(updatedUser);

      return true;
    } catch (err) {
      throw new Error(err.message || "Erro ao aceitar termos.");
    }
  }, [user, syncUser]);

  const loginWithGoogle = useCallback(async (code) => {
    setProfileError(null);
    try {
      const { user, token } = await authService.loginWithGoogle(code);
      if (user) {
        syncUser(user);
      } else {
        const profile = await authService.getProfile();
        syncUser(profile);
      }
      return true;
    } catch (err) {
      setProfileError(err?.message ?? "Erro na autenticação com Google.");
      throw err;
    }
  }, [syncUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      profileError,
      isAuthenticated: authService.isAuthenticated(),
      isAdmin: user?.role?.toUpperCase() === "ADMIN",
      refreshProfile,
      loginWithGoogle,
      startGoogleLogin,
      loginWithCredentials,
      logout,
      acceptTerms,
    }),
    [
      user,
      loading,
      profileError,
      refreshProfile,
      loginWithGoogle,
      startGoogleLogin,
      loginWithCredentials,
      logout,
      acceptTerms,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
