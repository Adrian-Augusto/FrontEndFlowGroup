import { usePayment } from "../hooks/usePayment";
import "./PaymentButton.css";

/**
 * Botão de pagamento para planos premium.
 * Destaca todos os grupos do usuário pelo período do plano.
 */
export function PaymentButton({ plan, groupId = null, disabled = false, onPaymentStart }) {
  const { loading, error, createPayment, clearError } = usePayment();

  const isDisabled = disabled || loading;

  const handleClick = async () => {
    clearError();
    onPaymentStart?.();
    console.log("[PaymentButton] Iniciando pagamento:", {
      planId: plan.id,
      groupId,
      subscriptionId: plan.subscriptionId,
      externalReference: plan.externalReference,
      hasGroupId: !!groupId
    });
    await createPayment(plan.id, groupId, plan.subscriptionId, plan.externalReference);
  };

  return (
    <div className="payment-button__wrapper">
      <button
        type="button"
        className="payment-button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={loading}
      >
        {loading ? (
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
