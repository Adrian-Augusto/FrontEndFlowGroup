import { api } from "../api/client";
import { apiRequest } from "../api/axiosClient";
import { API_ROUTES } from "../api/routes";
import { DEFAULT_API_ORIGIN } from "../api/routes";

/** @type {object | null} */
let memoryUser = null;

/**
 * Token storage utilities - uses localStorage for persistence
 */
const tokenStorage = {
  setAccessToken(token) {
    if (!token || typeof token !== "string") return;
    try {
      localStorage.setItem("accessToken", token);
    } catch (err) {
      console.error("[authService] Erro ao salvar token:", err);
    }
  },

  getAccessToken() {
    try {
      return localStorage.getItem("accessToken");
    } catch (err) {
      console.error("[authService] Erro ao recuperar token:", err);
      return null;
    }
  },

  removeAccessToken() {
    try {
      localStorage.removeItem("accessToken");
    } catch (err) {
      console.error("[authService] Erro ao remover token:", err);
    }
  },

  clear() {
    try {
      localStorage.removeItem("accessToken");
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
   * Define token de acesso no localStorage
   */
  setAccessToken(token) {
    tokenStorage.setAccessToken(token);
  },

  /**
   * Obtém token de acesso do localStorage
   */
  getAccessToken() {
    return tokenStorage.getAccessToken();
  },

  clearSession() {
    memoryUser = null;
    tokenStorage.clear();
  },

  isAuthenticated() {
    return Boolean(memoryUser) || Boolean(tokenStorage.getAccessToken());
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
      memoryUser = user;
      console.log("[authService] Usuário definido na memória:", memoryUser);
      
      // Retorna user e token se disponível
      return { user: memoryUser, token: response?.token ?? tokenStorage.getAccessToken() };
    } catch (err) {
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

  /**
   * Envia o code obtido do Google para o backend a fim de obter o token de acesso
   */
  async loginWithGoogle(code) {
    try {
      console.log("[authService] Trocando code por access_token...");
      const response = await apiRequest(
        `${API_ROUTES.auth.googleCallback}?code=${encodeURIComponent(code)}`
      );
      console.log("[authService] Resposta de loginWithGoogle:", response);

      const token =
        response?.accessToken ??
        response?.access_token ??
        response?.token ??
        response?.data?.accessToken ??
        response?.data?.token ??
        null;

      if (!token) {
        throw new Error("Token não retornado pelo backend após autenticação.");
      }

      tokenStorage.setAccessToken(token);

      const user = response?.user ?? response?.data?.user ?? response?.data ?? null;
      if (user) {
        memoryUser = user;
      }

      return { user, token };
    } catch (err) {
      console.error("[authService] Erro em loginWithGoogle:", err);
      throw err;
    }
  },

  /**
   * Obtém o perfil do usuário logado
   */
  async getProfile() {
    try {
      const result = await this.getCurrentUser();
      return result.user;
    } catch (err) {
      console.error("[authService] Erro em getProfile:", err);
      throw err;
    }
  },

  async login(email, password) {
    const response = await api.login({ email, password });
    if (response?.token) {
      tokenStorage.setAccessToken(response.token);
    }
    memoryUser = response.user;
    return response.user;
  },

  async logout() {
    try {
      // Call backend logout endpoint
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
