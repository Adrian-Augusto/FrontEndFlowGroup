import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";
import { PLANS } from "../data/plans";

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg, { cause: err });
  }
}

export const plansApi = {
  /** GET /api/v1/plans - Listar todos os planos disponíveis */
  async listPlans() {
    return request(API_ROUTES.plans.list);
  },

  /** GET /api/v1/plans/me - Obter plano atual do usuário */
  async getMyPlan() {
    return request(API_ROUTES.plans.me);
  },

  /** GET /api/v1/plans/active - Obter detalhes do plano ativo do usuário */
  async getActivePlan() {
    return request(API_ROUTES.plans.active);
  },

  /** POST /api/v1/plans/subscribe - Assinar um plano */
  async subscribe(planId) {
    return request(API_ROUTES.plans.subscribe, {
      method: "POST",
      data: { planId },
    });
  },

  /** POST /api/v1/plans/cancel - Cancelar plano */
  async cancelPlan() {
    return request(API_ROUTES.plans.cancel, {
      method: "POST",
    });
  },

  /** Buscar detalhes do plano por ID ou UUID */
  getPlanDetails(planId) {
    if (!planId) return null;
    
    // Mapeamento de UUID do backend para o ID local do frontend
    const uuidMap = {
      "e1042858-a403-4524-90ef-46d5d7a3670c": "test",
      "9c9fde4e-5115-46d4-b724-13aa9652520e": "three-days",
      "4562be0f-3d64-4b73-a4e6-0301bc7636e7": "seven-days",
      "abfdd079-7706-4efc-8b3b-5ebe10299657": "fifteen-days",
      "87e1a0c6-908b-4123-95da-9d2f7d2a308d": "monthly",
    };

    const resolvedId = uuidMap[planId] || planId;
    return PLANS.find(p => p.id === resolvedId) || null;
  },
};
