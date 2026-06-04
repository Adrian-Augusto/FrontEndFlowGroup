import { api } from "../api/client";
import { API_ROUTES } from "../api/routes";
import { DEFAULT_API_ORIGIN } from "../api/routes";

/** @type {object | null} */
let memoryUser = null;

/**
 * Token storage utilities - uses sessionStorage for XSS protection
 * sessionStorage is cleared when the browser tab closes
 */
const tokenStorage = {
  /**
   * Store access token in sessionStorage (not localStorage)
   * sessionStorage is not accessible from other tabs/windows
   * and is cleared on browser close
   */
  setAccessToken(token) {
    if (!token || typeof token !== "string") return;
    try {
      sessionStorage.setItem("accessToken", token);
    } catch (err) {
      console.error("[authService] Erro ao salvar token:", err);
    }
  },

  getAccessToken() {
    try {
      return sessionStorage.getItem("accessToken");
    } catch (err) {
      console.error("[authService] Erro ao recuperar token:", err);
      return null;
    }
  },

  removeAccessToken() {
    try {
      sessionStorage.removeItem("accessToken");
    } catch (err) {
      console.error("[authService] Erro ao remover token:", err);
    }
  },

  clear() {
    try {
      sessionStorage.removeItem("accessToken");
    } catch (err) {
      console.error("[authService] Erro ao limpar storage:", err);
    }
  },
};

export const authService = {
  /**
   * Define usuário na memória (após login)
   */
  setUser(user) {
    memoryUser = user;
  },

  getUser() {
    return memoryUser;
  },

  /**
   * Define token de acesso no sessionStorage
   */
  setAccessToken(token) {
    tokenStorage.setAccessToken(token);
  },

  /**
   * Obtém token de acesso do sessionStorage
   */
  getAccessToken() {
    return tokenStorage.getAccessToken();
  },

  clearSession() {
    memoryUser = null;
    tokenStorage.clear();
  },

  isAuthenticated() {
    return Boolean(memoryUser);
  },

  /**
   * Busca perfil do usuário do backend para verificar autenticação
   * Retorna { user, token } onde token pode ser nulo se não disponível
   */
  async getCurrentUser() {
    try {
      console.log("[authService] Buscando perfil do usuário...");
      const response = await api.getGoogleProfile();
      console.log("[authService] Resposta do perfil:", response);
      // getGoogleProfile retorna { data: user, raw: response, token? }
      const user = response?.data;
      if (!user) {
        throw new Error("Usuário não autenticado ou resposta inválida");
      }
      console.log("[authService] Usuário extraído:", user);
      memoryUser = user;
      console.log("[authService] Usuário definido na memória:", memoryUser);
      
      // Retorna user e token se disponível
      return { user: memoryUser, token: response?.token ?? null };
    } catch (err) {
      // Se for apenas uma falha de autenticação comum (não logado), registrar apenas como informação
      const isExpectedAuthFailure = 
        err.message?.includes("Unauthorized") || 
        err.message?.includes("não autenticado") || 
        err.message?.includes("401");

      if (isExpectedAuthFailure) {
        console.log("[authService] Nenhum usuário autenticado (sessão inexistente ou expirada).");
      } else {
        console.error("[authService] Erro inesperado ao buscar usuário:", err);
      }
      memoryUser = null;
      throw new Error("Usuário não autenticado ou resposta inválida", { cause: err });
    }
  },

  async login(email, password) {
    const response = await api.login({ email, password });
    if (response?.token) {
      // Store token in sessionStorage instead of localStorage for security
      tokenStorage.setAccessToken(response.token);
    }
    memoryUser = response.user;
    return response.user;
  },

  async logout() {
    try {
      // Call backend logout endpoint to clear HttpOnly cookie
      const backendOrigin = import.meta.env.VITE_API_ORIGIN?.trim() || DEFAULT_API_ORIGIN;
      await fetch(`${backendOrigin}${API_ROUTES.auth.logout}`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("[authService] Erro ao fazer logout no backend:", err);
    } finally {
      tokenStorage.removeAccessToken();
      memoryUser = null;
    }
  },
};

/**
 * Export token storage for use in axiosClient
 */
export { tokenStorage };
