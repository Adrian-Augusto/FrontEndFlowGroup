import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg, { cause: err });
  }
}

export const subscriptionsApi = {
  /** GET /api/v1/subscriptions/me - Obter assinaturas do usuário */
  async getMySubscriptions() {
    return request(API_ROUTES.subscriptions.me);
  },

  /** GET /api/v1/subscriptions/limits - Obter limites do plano do usuário */
  async getLimits() {
    return request(API_ROUTES.subscriptions.limits);
  },
};
