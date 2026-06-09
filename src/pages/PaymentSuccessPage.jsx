import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { paymentsApi } from "../api/paymentsApi";
import "./PaymentSuccessPage.css";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get("payment_id");
  const externalReference = searchParams.get("external_reference");
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
        console.error("[PaymentSuccess] Erro ao verificar pagamento:", err);
        setError("Não foi possível verificar o status do pagamento");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, sponsoredGroup]);

  if (loading) {
    return (
      <div className="payment-success">
        <div className="payment-success__container">
          <div className="payment-success__loader">
            <div className="payment-success__spinner"></div>
            <p>Verificando pagamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success">
        <div className="payment-success__container">
          <div className="payment-success__card payment-success__card--error">
            <div className="payment-success__icon">!</div>
            <h1 className="payment-success__title">Erro ao verificar pagamento</h1>
            <p className="payment-success__message">{error}</p>
            <Link to="/" className="payment-success__button">Voltar para home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success">
      <div className="payment-success__container">
        <div className="payment-success__card payment-success__card--success">
          <div className="payment-success__icon">✓</div>
          <h1 className="payment-success__title">Pagamento aprovado!</h1>
          <p className="payment-success__message">
            {sponsoredGroup 
              ? `Seu grupo "${sponsoredGroup.title}" foi patrocinado com sucesso!`
              : "Sua assinatura está ativa. Você pode anunciar seu grupo no topo."
            }
          </p>

          {details && (
            <div className="payment-success__details">
              <dl>
                {details.id && (
                  <>
                    <dt>ID do Pagamento</dt>
                    <dd className="mono">{details.id}</dd>
                  </>
                )}
                {sponsoredGroup && (
                  <>
                    <dt>Grupo Patrocinado</dt>
                    <dd>{sponsoredGroup.title}</dd>
                  </>
                )}
                {details.amount && (
                  <>
                    <dt>Valor</dt>
                    <dd>R$ {parseFloat(details.amount).toFixed(2)}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="payment-success__actions">
            <Link to="/" className="payment-success__button payment-success__button--primary">
              Voltar para home
            </Link>
            <Link to="/planos" className="payment-success__button payment-success__button--secondary">
              Ver outros planos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
