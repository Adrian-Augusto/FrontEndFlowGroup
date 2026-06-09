import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { paymentsApi } from "../api/paymentsApi";
import "./PaymentFailurePage.css";

export function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get("payment_id");
  const sponsoredGroup = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sponsoredGroup') 
    ? JSON.parse(sessionStorage.getItem('sponsoredGroup')) 
    : null;

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId) {
        setError("ID do pagamento não fornecido");
        setLoading(false);
        return;
      }

      try {
        // Validar status com backend (segurança: não confiar apenas na URL)
        const status = await paymentsApi.getPaymentStatus(paymentId);
        setDetails(status);
        
        // Limpar sessionStorage
        if (sponsoredGroup && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('sponsoredGroup');
        }
      } catch (err) {
        console.error("[PaymentFailure] Erro ao verificar pagamento:", err);
        setError("Não foi possível verificar o status do pagamento");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, sponsoredGroup]);

  if (loading) {
    return (
      <div className="payment-failure">
        <div className="payment-failure__container">
          <div className="payment-failure__loader">
            <div className="payment-failure__spinner"></div>
            <p>Verificando pagamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-failure">
      <div className="payment-failure__container">
        <div className="payment-failure__card">
          <div className="payment-failure__icon">✕</div>
          <h1 className="payment-failure__title">Pagamento não aprovado</h1>
          <p className="payment-failure__message">
            {error || "O pagamento foi rejeitado ou cancelado. Tente novamente ou escolha outra forma de pagamento."}
          </p>

          {details && (
            <div className="payment-failure__details">
              <dl>
                {details.id && (
                  <>
                    <dt>ID do Pagamento</dt>
                    <dd className="mono">{details.id}</dd>
                  </>
                )}
                {details.status && (
                  <>
                    <dt>Status</dt>
                    <dd>{details.status}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="payment-failure__actions">
            <Link to="/planos" className="payment-failure__button payment-failure__button--primary">
              Tentar novamente
            </Link>
            <Link to="/" className="payment-failure__button payment-failure__button--secondary">
              Voltar para home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
