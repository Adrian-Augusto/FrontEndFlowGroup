import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { getDisplayName } from "../utils/displayUserName";
import { plansApi } from "../api/plansApi";
import { normalizePlans } from "../utils/planNormalize";
import { groupsApi } from "../api/groupsApi";
import { PaymentButton } from "../components/PaymentButton";
import { SponsorGroupModal } from "../components/SponsorGroupModal";
import "./ProfilePage.css";

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
    Promise.resolve()
      .then(refreshProfile)
      .catch(() => null)
      .finally(() => setFetching(false));
  }, [refreshProfile]);

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
                  {user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.length > 0 ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar do usuário"
                      className="profile-page__photo"
                      width={96}
                      height={96}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement?.classList.add('profile-page__hero--no-photo');
                      }}
                    />
                  ) : (
                    <span className="profile-page__photo profile-page__photo--fallback" aria-hidden="true">
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



            {/* Seção de Assinaturas Disponíveis */}
            <div className="profile-page__card profile-page__card--plans">
              <h3 className="profile-page__section-title">Assinaturas Disponíveis</h3>
              
              {loadingPlans ? (
                <p className="profile-page__status">Carregando assinaturas...</p>
              ) : availablePlans.length > 0 ? (
                <div className="profile-page__plans-grid">
                  {availablePlans.map((plan) => {
                    const isCurrentPlan =
                      isActive && (subscription?.planId === plan.id || subscription?.planId === plan.localId);

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
