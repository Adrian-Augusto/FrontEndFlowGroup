import { useEffect, useState } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { paymentsApi } from "../api/paymentsApi";
import "./PaymentStatusPage.css";

const STATUS_CONFIG = {
  approved: {
    icon: "✓",
    title: "Pagamento aprovado!",
    message: "Sua assinatura está ativa. Você pode anunciar seu grupo no topo.",
    color: "success",
    action: { label: "Ver planos", to: "/planos" },
  },
  pending: {
    icon: "⏳",
    title: "Pagamento em análise",
    message: "Estamos verificando seu pagamento. Isso pode levar alguns minutos.",
    color: "pending",
    action: { label: "Voltar aos planos", to: "/planos" },
  },
  rejected: {
    icon: "✕",
    title: "Pagamento recusado",
    message: "Seu pagamento foi recusado. Verifique seus dados e tente novamente.",
    color: "error",
    action: { label: "Tentar novamente", to: "/planos" },
  },
  error: {
    icon: "!",
    title: "Erro ao verificar pagamento",
    message: "Não foi possível verificar o status. Tente novamente mais tarde.",
    color: "error",
    action: { label: "Voltar", to: "/" },
  },
};

export function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);

  const paymentId = searchParams.get("payment_id");
  const sponsoredGroup = location.state?.sponsoredGroup || 
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sponsoredGroup') 
      ? JSON.parse(sessionStorage.getItem('sponsoredGroup')) 
      : null);

  useEffect(() => {
    if (!paymentId) {
      setStatus("error");
      setError("payment_id não fornecido");
      return;
    }

    // Verificar status no servidor
    const checkPaymentStatus = async () => {
      try {
        const response = await paymentsApi.getPaymentStatus(paymentId);
        
        setStatus(response.status || "error");
        setDetails(response);
      } catch (err) {
        console.error("[Payment Status Error]", err);
        setStatus("error");
        setError(err.message);
      }
    };

    checkPaymentStatus();
  }, [paymentId]);

  // Limpar sessionStorage após carregar
  useEffect(() => {
    if (sponsoredGroup && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('sponsoredGroup');
    }
  }, [sponsoredGroup]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.error;

  return (
    <div className="payment-status">
      <div className="payment-status__container">
        <div className={`payment-status__card payment-status__card--${config.color}`}>
          <div className="payment-status__icon">{config.icon}</div>
          <h1 className="payment-status__title">{config.title}</h1>
          <p className="payment-status__message">{config.message}</p>

          {status === "loading" && (
            <div className="payment-status__spinner-wrapper">
              <span className="payment-status__spinner" />
              <p>Verificando pagamento...</p>
            </div>
          )}

          {details && (
            <div className="payment-status__details">
              <dl>
                {details.id && (
                  <>
                    <dt>ID do Pagamento</dt>
                    <dd className="mono">{details.id}</dd>
                  </>
                )}
                {details.amount && (
                  <>
                    <dt>Valor</dt>
                    <dd>
                      R$ {parseFloat(details.amount).toFixed(2)}
                    </dd>
                  </>
                )}
                {details.planName && (
                  <>
                    <dt>Plano</dt>
                    <dd>{details.planName}</dd>
                  </>
                )}
                {sponsoredGroup && (
                  <>
                    <dt>Grupo Patrocinado</dt>
                    <dd>{sponsoredGroup.title}</dd>
                  </>
                )}
                {details.expiresAt && (
                  <>
                    <dt>Válido até</dt>
                    <dd>
                      {new Date(details.expiresAt).toLocaleDateString("pt-BR")}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {error && (
            <div className="payment-status__error" role="alert">
              {error}
            </div>
          )}

          <Link to={config.action.to} className="payment-status__btn">
            {config.action.label}
          </Link>
        </div>

        <div className="payment-status__footer">
          <p>
            Dúvidas? Entre em contato com nosso suporte em{" "}
            <a href="mailto:support@octogr" style={{ color: "inherit", fontWeight: 600 }}>
              support@octogrupos.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
