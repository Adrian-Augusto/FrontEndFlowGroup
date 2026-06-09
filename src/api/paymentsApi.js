import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";

/**
 * Gera uma chave de idempotência única
 */
function generateIdempotencyKey(userId) {
  const timestamp = Date.now();
  return `${userId}-${timestamp}`;
}

/**
 * API para pagamentos com Mercado Pago
 * Segurança: Backend sempre valida status do pagamento
 */
export const paymentsApi = {
  /**
   * POST /api/v1/payments/create
   * Cria um pagamento para impulsionar um grupo específico
   *
   * Esperado pelo backend:
   * {
   *   "planId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
   *   "groupId": "grupo-uuid",
   *   "idempotencyKey": "user-123-1234567890"
   * }
   */
  async createPayment(planId, userId = null, groupId = null, subscriptionId = null, externalReference = null) {
    if (!planId) throw new Error("planId é obrigatório");

    try {
      // Gerar chave de idempotência
      const idempotencyKey = generateIdempotencyKey(userId || "unknown");

      // Preparar payload - INCLUI groupId para impulsionar grupo específico
      const payload = {
        planId,
        groupId,
        userId,
        subscriptionId,
        externalReference,
        idempotencyKey,
      };

      console.log("[paymentsApi] Enviando payload para backend:", {
        endpoint: API_ROUTES.payments.create,
        payload: {
          planId,
          groupId,
          userId,
          subscriptionId,
          externalReference,
          hasGroupId: !!groupId,
          idempotencyKey
        }
      });

      const response = await apiRequest(API_ROUTES.payments.create, {
        method: "POST",
        data: payload,
      });

      console.log("[paymentsApi] Resposta do backend:", {
        hasCheckoutUrl: !!response.checkout_url,
        responseKeys: Object.keys(response),
        fullResponse: response,
        responseType: typeof response,
        isNull: response === null,
        isUndefined: response === undefined
      });

      if (!response?.checkout_url) {
        console.error("[paymentsApi] checkout_url não encontrado na resposta:", response);
        throw new Error("Erro ao gerar link de pagamento");
      }

      return response;
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "Erro ao criar pagamento";
      console.error("[paymentsApi] Erro:", msg, err);
      console.error("[paymentsApi] Detalhes do erro:", {
        response: err.response,
        data: err.response?.data,
        status: err.response?.status
      });
      throw new Error(msg);
    }
  },

  /**
   * GET /api/v1/payments/status?payment_id=...
   * Verifica status do pagamento no backend
   * NUNCA confia em query params do cliente
   */
  async getPaymentStatus(paymentId) {
    if (!paymentId) throw new Error("payment_id é obrigatório");

    try {
      const response = await apiRequest(API_ROUTES.payments.status, {
        params: { payment_id: paymentId },
      });

      return response;
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "Erro ao verificar pagamento";
      throw new Error(msg);
    }
  },

  /**
   * GET /api/v1/payments/history
   * Lista histórico de pagamentos do usuário
   */
  async getPaymentHistory() {
    try {
      return await apiRequest(API_ROUTES.payments.history);
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "Erro ao buscar histórico";
      throw new Error(msg);
    }
  },
};
