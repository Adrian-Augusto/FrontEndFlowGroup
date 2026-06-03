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
    console.log("[termsApi] Fetching /api/v1/terms/version");
    const data = await request("/api/v1/terms/version");
    console.log("[termsApi] Version response:", data);
    return data?.version ?? 1;
  },

  /** GET /api/v1/terms/content - Obter conteúdo dos termos */
  async getContent() {
    console.log("[termsApi] Fetching /api/v1/terms/content");
    const data = await request("/api/v1/terms/content");
    console.log("[termsApi] Content response:", data);
    return data;
  },

  /** GET /api/v1/terms/status - Verificar se usuário aceitou os termos (requer auth) */
  async getStatus() {
    const data = await request("/api/v1/terms/status");
    
    console.log("[termsApi] Response BRUTO do backend:", JSON.stringify(data, null, 2));
    console.log("[termsApi] Todas as chaves:", Object.keys(data || {}));
    
    // Mapear diferentes formatos possíveis do backend
    let isAccepted = false;
    
    // Formato 1: { accepted: true/false }
    if (data?.accepted !== undefined) {
      isAccepted = data.accepted === true;
      console.log("[termsApi] Formato 1 (accepted boolean):", isAccepted);
    }
    // Formato 2: { status: "approved" ou "rejected" }
    else if (data?.status) {
      isAccepted = data.status === "approved" || data.status === "accepted";
      console.log("[termsApi] Formato 2 (status string):", isAccepted, `(status=${data.status})`);
    }
    // Formato 3: { termsAccepted: true/false }
    else if (data?.termsAccepted !== undefined) {
      isAccepted = data.termsAccepted === true;
      console.log("[termsApi] Formato 3 (termsAccepted boolean):", isAccepted);
    }
    
    console.log("[termsApi] Final accepted:", isAccepted);
    
    return {
      accepted: isAccepted,
      acceptedVersion: data?.acceptedVersion ?? null,
      acceptedAt: data?.acceptedAt ?? null,
      rawData: data, // para debug
    };
  },

  /** POST /api/v1/terms/accept - Aceitar os termos (requer auth) */
  async acceptTerms() {
    console.log("[termsApi] Enviando POST /api/v1/terms/accept com body:", { accepted: true });
    try {
      const response = await request("/api/v1/terms/accept", {
        method: "POST",
        data: { accepted: true },
      });
      console.log("[termsApi] ✅ Response do POST:", response);
      return response;
    } catch (err) {
      console.error("[termsApi] ❌ Erro no POST:", err);
      throw err;
    }
  },
};
