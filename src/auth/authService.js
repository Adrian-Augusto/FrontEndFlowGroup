import { api } from "../api/client";
import { API_ROUTES } from "../api/routes";
import { DEFAULT_API_ORIGIN } from "../api/routes";

/** @type {object | null} */
let memoryUser = null;

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

  clearSession() {
    memoryUser = null;
  },

  isAuthenticated() {
    return Boolean(memoryUser);
  },

  /**
   * Busca perfil do usuário do backend para verificar autenticação
   */
  async getCurrentUser() {
    try {
      console.log("[authService] Buscando perfil do usuário...");
      const response = await api.getGoogleProfile();
      console.log("[authService] Resposta do perfil:", response);
      // getGoogleProfile já retorna { data: user, raw: response }
      const user = response?.data;
      if (!user) {
        throw new Error("Usuário não autenticado ou resposta inválida");
      }
      console.log("[authService] Usuário extraído:", user);
      memoryUser = user;
      console.log("[authService] Usuário definido na memória:", memoryUser);
      return memoryUser;
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
      throw new Error("Usuário não autenticado ou resposta inválida");
    }
  },

  async login(email, password) {
    const response = await api.login({ email, password });
    if (response?.token) {
      localStorage.setItem("accessToken", response.token);
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
      localStorage.removeItem("accessToken");
      memoryUser = null;
    }
  },
};
