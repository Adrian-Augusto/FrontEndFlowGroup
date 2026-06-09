import { useCallback, useState } from "react";
import { paymentsApi } from "../api/paymentsApi";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gerenciar fluxo de pagamento
 * Handles: loading, errors, redirect
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const createPayment = useCallback(async (planId, groupId = null) => {
    setLoading(true);
    setError(null);

    try {
      if (!planId) {
        throw new Error("planId é obrigatório");
      }

      const userId = user?.id;
      console.log("[usePayment] Criando pagamento (Mercado Pago):", {
        planId,
        userId,
        groupId,
        hasGroupId: !!groupId
      });
      const response = await paymentsApi.createPayment(planId, userId, groupId);

      console.log("[usePayment] Resposta do backend (Mercado Pago):", {
        hasInitPoint: !!response.init_point,
        responseKeys: Object.keys(response)
      });

      // Salvar grupo patrocinado no sessionStorage para mostrar na página de status
      if (groupId) {
        // Buscar dados do grupo para passar para a página de status
        const groups = await import("../api/groupsApi").then(m => m.groupsApi.listApproved());
        const sponsoredGroup = groups.find(g => g.id === groupId);

        if (sponsoredGroup) {
          sessionStorage.setItem('sponsoredGroup', JSON.stringify(sponsoredGroup));
        }
      }

      // Limpar sessionStorage após iniciar pagamento
      if (groupId) {
        sessionStorage.removeItem('sponsorGroupId');
        console.log("[usePayment] groupId removido do sessionStorage");
      }

      // Redirect seguro para Mercado Pago
      if (response.init_point) {
        window.location.href = response.init_point;
        return true;
      }

      throw new Error("Link de pagamento não recebido");
    } catch (err) {
      const message = err.message || "Erro ao criar pagamento";
      setError(message);
      console.error("[Payment Error]", message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    createPayment,
    clearError,
  };
}
