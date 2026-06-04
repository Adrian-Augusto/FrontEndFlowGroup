import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { getDisplayName } from "../utils/displayUserName";
import { plansApi } from "../api/plansApi";
import { PLANS as FALLBACK_PLANS } from "../data/plans";
import { groupsApi } from "../api/groupsApi";
import { PaymentButton } from "../components/PaymentButton";
import { SponsorGroupModal } from "../components/SponsorGroupModal";
import "./ProfilePage.css";

function normalizePlans(apiPlans) {
  const fallbackMap = {
    0.01: FALLBACK_PLANS[4], // test
    12.9: FALLBACK_PLANS[0], // 3 dias
    24.9: FALLBACK_PLANS[1], // 7 dias
    39.9: FALLBACK_PLANS[2], // 15 dias
    49.9: FALLBACK_PLANS[3], // 30 dias
  };

  return apiPlans.map((plan) => {
    const priceVal = Number(plan.price);
    const fallback = fallbackMap[priceVal] || FALLBACK_PLANS[0];
    return {
      ...fallback,
      id: plan.id, // USAR O UUID DA API, não o ID do fallback!
      price: priceVal,
    };
  });
}

export function ProfilePage() {
  const { user, loading, profileError, refreshProfile } = useAuth();
  const { subscription, isActive, cancel } = useSubscription();
  const [fetching, setFetching] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [sponsorshipLimits, setSponsorshipLimits] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);

  const loadUserGroups = async () => {
    try {
      const allGroups = await groupsApi.listMine();
      setUserGroups(allGroups || []);
    } catch (err) {
      console.error("Erro ao carregar grupos do usuário:", err);
      setUserGroups([]);
    }
  };

  const loadPlansData = async () => {
    setLoadingPlans(true);
    try {
      const response = await plansApi.listPlans();
      let plansList = [];

      if (Array.isArray(response)) {
        plansList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        plansList = response.data;
      } else if (response?.plans && Array.isArray(response.plans)) {
        plansList = response.plans;
      }

      const normalized = normalizePlans(plansList);
      setAvailablePlans(normalized);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      setAvailablePlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadSponsorshipLimits = async () => {
    try {
      const data = await groupsApi.getSponsorshipLimits();
      if (data?.data) {
        setSponsorshipLimits(data.data);
      } else if (data) {
        setSponsorshipLimits(data);
      } else {
        setSponsorshipLimits(null);
      }
    } catch (err) {
      console.error("Erro ao carregar limites de patrocínio:", err);
      setSponsorshipLimits(null);
    }
  };

  useEffect(() => {
    // Não chamamos refreshProfile aqui para evitar conflito de estado
    // O usuário já está disponível via AuthContext
    setFetching(false);
  }, []);

  useEffect(() => {
    if (user) {
      const init = async () => {
        await Promise.resolve();
        loadSponsorshipLimits();
        loadPlansData();
        loadUserGroups();
      };
      init();
    }
  }, [user, isActive, subscription]);

  const busy = loading || fetching;
  const displayName = getDisplayName(user);

  const handleCancelPlan = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    
    setCanceling(true);
    setCancelError(null);
    
    const success = await cancel();
    
    if (success) {
      // Toast de sucesso
      setCanceling(false);
    } else {
      setCancelError("Erro ao cancelar plano. Tente novamente.");
      setCanceling(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const maxGroups = sponsorshipLimits?.sponsoredGroups?.max ?? 5;
  const activeGroups = sponsorshipLimits?.sponsoredGroups?.active ?? 0;
  const remainingGroups = sponsorshipLimits?.sponsoredGroups?.remaining ?? (maxGroups - activeGroups);
  const canSponsorMore = Boolean(sponsorshipLimits?.canSponsor && remainingGroups > 0 && (maxGroups - activeGroups) > 0);

  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <Link to="/" className="profile-page__back">
          ← Voltar aos grupos
        </Link>

        <h1 className="profile-page__title">Meu perfil</h1>

        {busy && (
          <p className="profile-page__status" role="status">
            Carregando dados do servidor…
          </p>
        )}

        {!busy && profileError && (
          <div className="profile-page__alert" role="alert">
            <p>{profileError}</p>
            <button type="button" className="profile-page__retry" onClick={() => refreshProfile()}>
              Tentar novamente
            </button>
          </div>
        )}

        {!busy && user && (
          <div className="profile-page__dashboard">
            <div className="profile-page__column profile-page__column--sidebar">
              <div className="profile-page__card">
                <div className="profile-page__hero">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="profile-page__photo"
                      width={96}
                      height={96}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="profile-page__photo profile-page__photo--fallback">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h2 className="profile-page__name">{displayName}</h2>
                    <p className="profile-page__email">{user.email ?? "—"}</p>
                  </div>
                </div>

                <dl className="profile-page__dl">
                  <div className="profile-page__row">
                    <dt>Nome completo</dt>
                    <dd>{user.name ?? "—"}</dd>
                  </div>
                  <div className="profile-page__row">
                    <dt>E-mail</dt>
                    <dd>{user.email ?? "—"}</dd>
                  </div>
                  <div className="profile-page__row">
                    <dt>Google ID</dt>
                    <dd className="profile-page__mono">{user.googleId ?? user.id ?? "—"}</dd>
                  </div>
                  <div className="profile-page__row">
                    <dt>Perfil</dt>
                    <dd>
                      <span className={`profile-page__badge profile-page__badge--${user.role ?? "user"}`}>
                        {user.role?.toUpperCase() === "ADMIN" ? "Administrador" : "Usuário"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="profile-page__column profile-page__column--main">
              {/* Seção de Patrocínios */}
              {sponsorshipLimits && (
                <div className="profile-page__card">
                  <h3 className="profile-page__section-title">Meus Patrocínios</h3>
                  
                  <div className="profile-page__sponsorship">
                    <div className="sponsorship-progress">
                      <div className="sponsorship-progress__label">
                        <span>Grupos Patrocinados</span>
                        <strong>
                          {sponsorshipLimits.sponsoredGroups?.active || 0}/
                          {sponsorshipLimits.sponsoredGroups?.max || 5}
                        </strong>
                      </div>
                      <div className="sponsorship-progress__bar">
                        {Array.from({ length: sponsorshipLimits.sponsoredGroups?.max || 5 }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className={`sponsorship-progress__slot ${
                                i < (sponsorshipLimits.sponsoredGroups?.active || 0)
                                  ? "sponsorship-progress__slot--filled"
                                  : ""
                              }`}
                            />
                          )
                        )}
                      </div>
                      <p className="sponsorship-progress__remaining">
                        Espaço disponível: {(sponsorshipLimits.sponsoredGroups?.max || 5) - (sponsorshipLimits.sponsoredGroups?.active || 0)}
                      </p>
                    </div>
                    
                    {canSponsorMore ? (
                      <div className="profile-page__sponsorship-status profile-page__sponsorship-status--available">
                        <p>✅ Você pode patrocinar mais grupos!</p>
                      </div>
                    ) : (
                      <div className="profile-page__sponsorship-status profile-page__sponsorship-status--limited">
                        <p>⚠️ Você atingiu o limite de patrocínios.</p>
                        <Link to="/planos" className="profile-page__upgrade-btn">
                          Fazer upgrade
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="profile-page__card">
                <h3 className="profile-page__section-title">Minha Assinatura</h3>

                {isActive && subscription ? (
                  <div className="profile-page__subscription">
                    <div className="profile-page__plan-info">
                      <div className="profile-page__plan-header">
                        <h4 className="profile-page__plan-name">{subscription.planName || "Plano"}</h4>
                        <span className="profile-page__plan-badge">{subscription.status || "Ativo"}</span>
                      </div>
                      
                      <dl className="profile-page__plan-details">
                        <div className="profile-page__plan-row">
                          <dt>Preço</dt>
                          <dd>R$ {subscription.price ? subscription.price.toFixed(2) : "—"}</dd>
                        </div>
                        <div className="profile-page__plan-row">
                          <dt>Válido até</dt>
                          <dd>{formatDate(subscription.expiresAt)}</dd>
                        </div>
                        <div className="profile-page__plan-row">
                          <dt>Início</dt>
                          <dd>{formatDate(subscription.startedAt)}</dd>
                        </div>
                      </dl>

                      {cancelError && (
                        <div className="profile-page__error" role="alert">
                          {cancelError}
                        </div>
                      )}

                      <div className="profile-page__plan-actions">
                        {canSponsorMore && (
                          <button
                            type="button"
                            className="profile-page__sponsor-btn"
                            onClick={() => setSponsorModalOpen(true)}
                          >
                            ⭐ Patrocinar Grupo
                          </button>
                        )}
                        <button
                          type="button"
                          className="profile-page__cancel-btn"
                          onClick={handleCancelPlan}
                          disabled={canceling}
                        >
                          {canceling ? "Cancelando..." : "Cancelar assinatura"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="profile-page__no-plan">
                    <p>Você ainda não possui uma assinatura ativa.</p>
                    <Link to="/planos" className="profile-page__upgrade-btn">
                      Ver assinaturas disponíveis
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Assinaturas Disponíveis */}
            <div className="profile-page__card profile-page__card--plans">
              <h3 className="profile-page__section-title">Assinaturas Disponíveis</h3>
              
              {loadingPlans ? (
                <p className="profile-page__status">Carregando assinaturas...</p>
              ) : availablePlans.length > 0 ? (
                <div className="profile-page__plans-grid">
                  {availablePlans.map((plan) => {
                    const isCurrentPlan = isActive && subscription?.planId === plan.id;

                    return (
                      <div key={plan.id} className={`profile-page__plan-card ${isCurrentPlan ? "profile-page__plan-card--current" : ""}`}>
                        <div className="profile-page__plan-card-header">
                          <h4 className="profile-page__plan-card-name">{plan.name}</h4>
                          {isCurrentPlan && <span className="profile-page__plan-card-current">Assinatura atual</span>}
                        </div>

                        <p className="profile-page__plan-card-price">R$ {plan.price.toFixed(2)}</p>

                        {plan.description && (
                          <p className="profile-page__plan-card-description">{plan.description}</p>
                        )}

                        <div className="profile-page__plan-card-duration">
                          <small>{plan.durationDays} dias de validade</small>
                        </div>

                        {!isCurrentPlan && !isActive && (
                          <PaymentButton
                            plan={plan}
                            disabled={false}
                            onPaymentStart={() => console.log("Iniciando pagamento para plano:", plan.name)}
                          />
                        )}

                        {!isCurrentPlan && isActive && (
                          <div className="profile-page__plan-card-info">
                            <small>Você já possui uma assinatura ativa</small>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="profile-page__status">Nenhuma assinatura disponível no momento.</p>
              )}
            </div>
          </div>
        )}

        {!busy && !user && !profileError && (
          <p className="profile-page__status">Nenhum dado de perfil disponível.</p>
        )}
      </div>

      <SponsorGroupModal
        isOpen={sponsorModalOpen}
        onClose={() => setSponsorModalOpen(false)}
        onSponsorSuccess={() => {
          loadSponsorshipLimits();
          loadUserGroups();
        }}
        userGroups={userGroups}
      />
    </div>
  );
}
