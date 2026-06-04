import { apiRequest } from "./axiosClient";

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg);
  }
}

export const termsApi = {
  /** GET /api/v1/terms/version - Obter versão atual dos termos */
  async getVersion() {
    const data = await request("/api/v1/terms/version");
    return data?.version ?? 1;
  },

  /** GET /api/v1/terms/content - Obter conteúdo dos termos */
  async getContent() {
    const data = await request("/api/v1/terms/content");
    return data;
  },

  /** GET /api/v1/terms/status - Verificar se usuário aceitou os termos (requer auth) */
  async getStatus() {
    const data = await request("/api/v1/terms/status");

    // Backend retorna: { termsAccepted: true/false, userVersion: 0, currentVersion: 1, needsUpdate: true/false }
    const termsAccepted = data?.termsAccepted === true;
    const needsUpdate = data?.needsUpdate === true;

    return {
      accepted: termsAccepted,
      termsAccepted: termsAccepted,
      userVersion: data?.userVersion ?? 0,
      currentVersion: data?.currentVersion ?? 1,
      needsUpdate: needsUpdate,
    };
  },

  /** POST /api/v1/terms/accept - Aceitar os termos (requer auth) */
  async acceptTerms() {
    try {
      const response = await request("/api/v1/terms/accept", {
        method: "POST",
        data: { accepted: true },
      });
      // Backend retorna { message: '...', user: {...} }
      // Extrair usuário da resposta para atualizar estado local
      const updatedUser = response?.user || response?.data?.user || response;
      return updatedUser;
    } catch (err) {
      console.error("[termsApi] Erro ao aceitar termos:", err);
      throw err;
    }
  },
};
