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

  const createPayment = useCallback(async (planId) => {
    setLoading(true);
    setError(null);

    try {
      if (!planId) {
        throw new Error("planId é obrigatório");
      }

      const userId = user?.id;
      // groupId não é necessário - plano premium para TODOS os grupos
      const response = await paymentsApi.createPayment(planId, userId);

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
