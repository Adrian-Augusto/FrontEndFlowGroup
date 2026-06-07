import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { plansApi } from "../api/plansApi";
import { groupsApi } from "../api/groupsApi";
import { PLANS as FALLBACK_PLANS } from "../data/plans";
import { normalizePlans } from "../utils/planNormalize";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { PaymentButton } from "../components/PaymentButton";
import "./PlansPage.css";

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDiscountPercent(plan) {
  if (!plan.originalPrice || plan.originalPrice <= plan.price) return null;
  return Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
}

function getSavings(plan) {
  if (!plan.originalPrice || plan.originalPrice <= plan.price) return null;
  return plan.originalPrice - plan.price;
}

export function PlansPage() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Receber dados do grupo do state (quando vem do modal de impulsionar)
  const sponsorGroupId = location.state?.groupId;

  const loadUserGroups = useCallback(async () => {
    if (!userId) return;

    setLoadingGroups(true);
    try {
      const allGroups = await groupsApi.listApproved();
      const myGroups = allGroups.filter((g) => g.createdBy?.id === userId);
      setUserGroups(myGroups);
    } catch (err) {
      console.error("[PlansPage] Erro ao carregar grupos do usuário:", err);
      setUserGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      Promise.resolve().then(loadUserGroups);
    } else {
      Promise.resolve().then(() => setUserGroups([]));
    }
  }, [isAuthenticated, loadUserGroups, userId]);

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      try {
        const response = await plansApi.listPlans();
        let plansData = [];

        if (Array.isArray(response)) {
          plansData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          plansData = response.data;
        } else if (response?.plans && Array.isArray(response.plans)) {
          plansData = response.plans;
        } else {
          plansData = FALLBACK_PLANS;
        }

        const normalized = normalizePlans(plansData);
        setPlans(normalized?.length ? normalized : FALLBACK_PLANS);
      } catch (err) {
        console.error("[PlansPage] Erro ao carregar planos:", err);
        setPlans(FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    }

    Promise.resolve().then(loadPlans);
  }, []);

  const requireLogin = () => {
    if (!isAuthenticated) {
      showToast("Faça login para contratar um plano.");
      navigate("/login", { state: { from: "/planos" } });
    }

  };

  if (loading) {
    return (
      <div className="plans-body">
        <div className="plans-shell plans-shell--loading">
          <span className="plans-loader" aria-hidden="true" />
          <p>Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plans-body">
      <section className="plans-shell" aria-labelledby="plans-title">
        <div className="plans-heading">
          <span className="plans-eyebrow">Destaque seus grupos</span>
          <div>
            <h1 id="plans-title">Escolha o tempo de visibilidade</h1>
            <p>
              Seus grupos aparecem no bloco de destaque pelo período contratado,
              com acesso direto para novos visitantes.
            </p>
            {isAuthenticated && !loadingGroups && userGroups.length > 0 && (
              <p className="plans-heading__hint">Planos disponíveis para seus grupos</p>
            )}
            {isAuthenticated && !loadingGroups && userGroups.length === 0 && (
              <p className="plans-heading__hint">Crie um grupo primeiro para ver planos personalizados</p>
            )}
          </div>
        </div>

        <div className="plans-grid">
          {(plans || []).map((plan) => {
            const discountPercent = getDiscountPercent(plan);
            const savings = getSavings(plan);
            return (
              <article
                key={plan.id}
                className={`plan-card ${plan.popular ? "plan-card--popular" : ""}`}
              >
                <div className="plan-card__top">
                  <span className="plan-card__icon" aria-hidden="true">
                    {plan.emoji}
                  </span>
                  <div className="plan-card__badges">
                    {plan.popular && <span className="plan-badge">Mais popular</span>}
                    {discountPercent && (
                      <span className="plan-badge plan-badge--deal">{discountPercent}% OFF</span>
                    )}
                  </div>
                </div>

                <h2 className="plan-card__name">{plan.name}</h2>

                <div className="plan-card__price-block">
                  {plan.originalPrice && (
                    <div className="plan-card__price-old">De {formatPrice(plan.originalPrice)}</div>
                  )}
                  <div className="plan-card__price-row">
                    {plan.originalPrice && (
                      <span className="plan-card__price-label">Por</span>
                    )}
                    <div className="plan-card__price">{formatPrice(plan.price)}</div>
                  </div>
                  <div className="plan-card__period">por {plan.period}</div>
                  {savings && (
                    <span className="plan-card__savings">🔥 Economize {formatPrice(savings)}</span>
                  )}
                  {plan.isOffer && plan.offerText && (
                    <span className="plan-card__note">{plan.offerText}</span>
                  )}
                </div>

                <p className="plan-card__desc">{plan.description}</p>

                <ul className="plan-card__features">
                  {(plan.features || []).map((feature) => (
                    <li key={feature}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isAuthenticated ? (
                  <PaymentButton plan={plan} groupId={sponsorGroupId} />
                ) : (
                  <button
                    type="button"
                    className={`plan-card__button ${plan.popular ? "plan-card__button--solid" : ""}`}
                    onClick={requireLogin}
                  >
                    Contratar {plan.name}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
