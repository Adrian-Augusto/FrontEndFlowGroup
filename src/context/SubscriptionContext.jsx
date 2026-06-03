import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { plansApi } from "../api/plansApi";
import { PLAN_IDS } from "../data/plans";

const STORAGE_KEY = "octo_subscription";

function loadSubscription() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSubscription(data) {
  if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  else localStorage.removeItem(STORAGE_KEY);
}

function computeExpiry(planId) {
  const now = Date.now();
  const days = planId === PLAN_IDS.WEEKLY ? 7 : 30;
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
}

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar plano do servidor ao montar ou quando usuário muda
  useEffect(() => {
    if (!isAuthenticated) {
      setSubscription(null);
      return;
    }

    setLoading(true);
    plansApi
      .getActivePlan()
      .then((data) => {
        const subscriptionData = data?.data || data;
        if (subscriptionData?.planId) {
          setSubscription({
            planId: subscriptionData.planId,
            userId: user?.id,
            startedAt: subscriptionData.startedAt || new Date().toISOString(),
            expiresAt: subscriptionData.expiresAt,
            planName: subscriptionData.planName,
            price: subscriptionData.price,
            status: subscriptionData.status,
          });
          saveSubscription(subscriptionData);
        } else {
          setSubscription(null);
          saveSubscription(null);
        }
      })
      .catch((err) => {
        // Fallback ao localStorage se endpoint não existir ainda
        console.warn("[Subscription] GET /api/v1/plans/active não implementado, usando cache local", err);
        setSubscription(loadSubscription());
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.id]);

  const isActive = useMemo(() => {
    if (!subscription?.expiresAt) return false;
    return new Date(subscription.expiresAt) > new Date();
  }, [subscription]);

  const subscribe = useCallback(
    async (planId) => {
      if (!isAuthenticated) return false;
      try {
        const result = await plansApi.subscribe(planId);
        const next = {
          planId,
          userId: user?.id,
          startedAt: result.startedAt || new Date().toISOString(),
          expiresAt: result.expiresAt,
        };
        saveSubscription(next);
        setSubscription(next);
        return true;
      } catch (err) {
        console.error("Erro ao assinar plano:", err);
        return false;
      }
    },
    [isAuthenticated, user?.id],
  );

  const cancel = useCallback(async () => {
    try {
      await plansApi.cancelPlan();
      saveSubscription(null);
      setSubscription(null);
      return true;
    } catch (err) {
      console.error("Erro ao cancelar plano:", err);
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      subscription: isActive ? subscription : null,
      planId: isActive ? subscription?.planId : null,
      isActive,
      subscribe,
      cancel,
      loading,
    }),
    [subscription, isActive, subscribe, cancel, loading],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription dentro de SubscriptionProvider");
  return ctx;
}
