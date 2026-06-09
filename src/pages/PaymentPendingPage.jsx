import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { paymentsApi } from "../api/paymentsApi";
import "./PaymentPendingPage.css";

export function PaymentPendingPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get("payment_id");
  const paymentType = searchParams.get("payment_type") || "pix";
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
        console.error("[PaymentPending] Erro ao verificar pagamento:", err);
        setError("Não foi possível verificar o status do pagamento");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, sponsoredGroup]);

  if (loading) {
    return (
      <div className="payment-pending">
        <div className="payment-pending__container">
          <div className="payment-pending__loader">
            <div className="payment-pending__spinner"></div>
            <p>Verificando pagamento...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPix = paymentType === "pix";
  const isBoleto = paymentType === "boleto";

  return (
    <div className="payment-pending">
      <div className="payment-pending__container">
        <div className="payment-pending__card">
          <div className="payment-pending__icon">⏳</div>
          <h1 className="payment-pending__title">Pagamento em processamento</h1>
          <p className="payment-pending__message">
            {isPix && "Seu pagamento Pix está sendo processado. Após a confirmação, seu grupo será patrocinado automaticamente."}
            {isBoleto && "Seu boleto foi gerado e está aguardando pagamento. Após a compensação, seu grupo será patrocinado automaticamente."}
            {!isPix && !isBoleto && "Seu pagamento está sendo processado. Após a confirmação, seu grupo será patrocinado automaticamente."}
          </p>

          {details && (
            <div className="payment-pending__details">
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

          <div className="payment-pending__info">
            <p>
              <strong>Tempo estimado:</strong>
              {isPix && " até 30 minutos"}
              {isBoleto && " até 3 dias úteis"}
              {!isPix && !isBoleto && " até 24 horas"}
            </p>
          </div>

          <div className="payment-pending__actions">
            <Link to="/" className="payment-pending__button payment-pending__button--primary">
              Voltar para home
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="payment-pending__button payment-pending__button--secondary"
            >
              Verificar status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
