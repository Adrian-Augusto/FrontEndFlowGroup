import { useState } from "react";
import { usePayment } from "../hooks/usePayment";
import "./PaymentButton.css";

/**
 * Botão de pagamento para planos premium.
 * Destaca todos os grupos do usuário pelo período do plano.
 */
export function PaymentButton({ plan, groupId = null, disabled = false, onPaymentStart }) {
  const { loading, error, createPayment, clearError } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const isDisabled = disabled || loading || isProcessing;

  const handleClick = async () => {
    if (isProcessing) return; // Evitar múltiplos cliques

    clearError();
    setIsProcessing(true);
    onPaymentStart?.();
    
    console.log("[PaymentButton] Iniciando pagamento (Mercado Pago):", {
      planId: plan.id,
      groupId,
      hasGroupId: !!groupId
    });
    
    const success = await createPayment(plan.id, groupId);
    
    if (!success) {
      setIsProcessing(false);
    }
    // Se sucesso, não resetar isProcessing pois vai redirecionar
  };

  return (
    <div className="payment-button__wrapper">
      <button
        type="button"
        className="payment-button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={loading || isProcessing}
      >
        {loading || isProcessing ? (
          <>
            <span className="payment-button__spinner" aria-hidden="true" />
            Processando...
          </>
        ) : (
          `Contratar - ${plan.name}`
        )}
      </button>

      {error && (
        <div className="payment-button__error" role="alert">
          <span className="payment-button__error-icon">⚠️</span>
          <span>{error}</span>
          <button
            type="button"
            className="payment-button__error-close"
            onClick={clearError}
            aria-label="Fechar erro"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
