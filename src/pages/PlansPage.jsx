import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { plansApi } from "../api/plansApi";
import { groupsApi } from "../api/groupsApi";
import { PLANS as FALLBACK_PLANS } from "../data/plans";
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

function normalizePlans(apiPlans) {
  const fallbackByPrice = new Map([
    [9.9, FALLBACK_PLANS[0]],
    [19.9, FALLBACK_PLANS[1]],
    [29.9, FALLBACK_PLANS[2]],
    [49.9, FALLBACK_PLANS[3]],
  ]);

  return apiPlans
    .filter((plan) => Number(plan.price) !== 0.01 && plan.id !== "test")
    .map((plan) => {
      const priceVal = Number(plan.price);
      const priceKey = Math.round(priceVal * 100) / 100;
      const fallback = fallbackByPrice.get(priceKey) || FALLBACK_PLANS[0];

      return {
        ...fallback,
        id: plan.id,
        price: priceVal,
      };
    });
}

export function PlansPage() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Receber dados do grupo do state (quando vem do modal de impulsionar)
  const sponsorGroupId = location.state?.groupId;
  const sponsorGroup = location.state?.group;

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

        plansData = plansData.filter((plan) => Number(plan.price) !== 0.01 && plan.id !== "test");

        const fallbackIds = ["three-days", "seven-days", "fifteen-days", "monthly"];
        const isBackendResponse =
          plansData?.length && plansData[0].id && !fallbackIds.includes(plansData[0].id);
        const normalized = isBackendResponse ? normalizePlans(plansData) : plansData;
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

  const handlePaymentStart = () => {
    setSelectedPlanId(null);
  };

  const handlePlanClick = (planId) => {
    if (!isAuthenticated) {
      showToast("Faça login para contratar um plano.");
      navigate("/login", { state: { from: "/planos" } });
      return;
    }

    setSelectedPlanId(planId);
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

                {selectedPlanId === plan.id && isAuthenticated ? (
                  <PaymentButton plan={plan} groupId={sponsorGroupId} onPaymentStart={handlePaymentStart} />
                ) : (
                  <button
                    type="button"
                    className={`plan-card__button ${plan.popular ? "plan-card__button--solid" : ""}`}
                    onClick={() => handlePlanClick(plan.id)}
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
