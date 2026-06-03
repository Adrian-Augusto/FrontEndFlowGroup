import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  console.log("[normalizePlans] Input apiPlans:", apiPlans);
  console.log("[normalizePlans] apiPlans.length:", apiPlans?.length);

  const fallbackMap = {
    0.01: FALLBACK_PLANS[4], // test
    12.9: FALLBACK_PLANS[0], // 3 dias
    12.90: FALLBACK_PLANS[0], // 3 dias (alternative format)
    24.9: FALLBACK_PLANS[1], // 7 dias
    24.90: FALLBACK_PLANS[1], // 7 dias (alternative format)
    39.9: FALLBACK_PLANS[2], // 15 dias
    39.90: FALLBACK_PLANS[2], // 15 dias (alternative format)
    49.9: FALLBACK_PLANS[3], // 30 dias
    49.90: FALLBACK_PLANS[3], // 30 dias (alternative format)
  };

  const normalized = apiPlans.map((plan) => {
    const priceVal = Number(plan.price);
    // Try exact match first, then rounded
    const fallback = fallbackMap[priceVal] || fallbackMap[Math.round(priceVal * 10) / 10] || FALLBACK_PLANS[0];
    console.log("[normalizePlans] Processing plan:", { priceVal, fallbackId: fallback?.id });
    return {
      ...fallback,
      id: plan.id, // USAR O UUID DA API, não o ID do fallback!
      price: priceVal,
    };
  });

  console.log("[normalizePlans] Output normalized:", normalized);
  console.log("[normalizePlans] normalized.length:", normalized?.length);
  return normalized;
}

export function PlansPage() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Load user groups to determine which plans to show
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserGroups();
    }
  }, [isAuthenticated, user?.id]);

  const loadUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const allGroups = await groupsApi.listApproved();
      const myGroups = allGroups.filter((g) => g.createdBy?.id === user.id);
      setUserGroups(myGroups);
    } catch (err) {
      console.error("[PlansPage] Erro ao carregar grupos do usuário:", err);
      setUserGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Filter plans based on user group categories
  const getFilteredPlans = (allPlans, groups) => {
    // Always show all plans - filtering by category is too restrictive
    return allPlans;
  };

  useEffect(() => {
    console.log("[PlansPage] FALLBACK_PLANS:", FALLBACK_PLANS);
    (async () => {
      try {
        const response = await plansApi.listPlans();
        console.log("[PlansPage] Raw response from API:", response);
        let plansData = [];

        if (Array.isArray(response)) {
          plansData = response;
          console.log("[PlansPage] Response is an array, using directly");
        } else if (response?.data && Array.isArray(response.data)) {
          plansData = response.data;
          console.log("[PlansPage] Response has data array, using response.data");
        } else if (response?.plans && Array.isArray(response.plans)) {
          plansData = response.plans;
          console.log("[PlansPage] Response has plans array, using response.plans");
        } else {
          plansData = FALLBACK_PLANS;
          console.log("[PlansPage] No valid array found, using fallback plans");
        }

        console.log("[PlansPage] plansData:", plansData);
        console.log("[PlansPage] plansData.length:", plansData?.length);
        const fallbackIds = ["test", "three-days", "seven-days", "fifteen-days", "monthly"];
        const isBackendResponse = plansData?.length && plansData[0].id && !fallbackIds.includes(plansData[0].id);
        console.log("[PlansPage] isBackendResponse:", isBackendResponse);
        const normalized = isBackendResponse ? normalizePlans(plansData) : plansData;
        const basePlans = normalized?.length ? normalized : FALLBACK_PLANS;

        console.log("[PlansPage] basePlans:", basePlans);
        console.log("[PlansPage] basePlans.length:", basePlans?.length);

        // Always show all plans
        setPlans(basePlans);
      } catch (err) {
        console.error("[PlansPage] Erro:", err);
        setPlans(FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePaymentStart = () => {
    setSelectedPlanId(null);
  };

  const handlePlanClick = (planId) => {
    console.log("[PlansPage] Clique:", { planId, isAuthenticated, selectedPlanId });
    if (!isAuthenticated) {
      console.log("[PlansPage] Não autenticado, redirecionando para login");
      showToast("Faca login para contratar um plano.");
      navigate("/login", { state: { from: "/planos" } });
      return;
    }

    console.log("[PlansPage] Definindo selectedPlanId para:", planId);
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
              Seus grupos aparecem no bloco de destaque pelo periodo contratado,
              com acesso direto para novos visitantes.
            </p>
            {isAuthenticated && userGroups.length > 0 && (
              <p style={{ marginTop: "12px", fontSize: "0.95em", color: "#666" }}>
                📌 Planos disponíveis para seus grupos
              </p>
            )}
            {isAuthenticated && userGroups.length === 0 && (
              <p style={{ marginTop: "12px", fontSize: "0.95em", color: "#666" }}>
                💡 Crie um grupo primeiro para ver planos personalizados
              </p>
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
                className={`plan-card ${plan.popular ? "plan-card--popular" : ""} ${
                  plan.id === "test" ? "plan-card--test" : ""
                }`}
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
                    {plan.id === "test" && (
                      <span className="plan-badge plan-badge--test">Teste</span>
                    )}
                  </div>
                </div>

                <div className="plan-card__name">{plan.name}</div>

                <div className="plan-card__price-block">
                  {plan.originalPrice && (
                    <div className="plan-card__price-old">
                      De {formatPrice(plan.originalPrice)}
                    </div>
                  )}
                  <div className="plan-card__price">{formatPrice(plan.price)}</div>
                  <div className="plan-card__period">por {plan.period}</div>
                  {savings && (
                    <span className="plan-card__savings">
                      Economize {formatPrice(savings)}
                    </span>
                  )}
                  {plan.isOffer && plan.offerText && (
                    <span className="plan-card__note">{plan.offerText}</span>
                  )}
                </div>

                <p className="plan-card__desc">{plan.description}</p>

                <ul className="plan-card__features">
                  {(plan.features || []).map((feature, idx) => (
                    <li key={idx}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlanId === plan.id && isAuthenticated ? (
                  <PaymentButton plan={plan} onPaymentStart={handlePaymentStart} />
                ) : (
                  <button
                    type="button"
                    className={`plan-card__button ${
                      plan.popular ? "plan-card__button--solid" : ""
                    } ${plan.id === "test" ? "plan-card__button--test" : ""}`}
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
