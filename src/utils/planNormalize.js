import { PLANS as FALLBACK_PLANS } from "../data/plans";

const BACKEND_PLAN_IDS = {
  "e1042858-a403-4524-90ef-46d5d7a3670c": "test",
  "9c9fde4e-5115-46d4-b724-13aa9652520e": "three-days",
  "4562be0f-3d64-4b73-a4e6-0301bc7636e7": "seven-days",
  "abfdd079-7706-4efc-8b3b-5ebe10299657": "fifteen-days",
  "87e1a0c6-908b-4123-95da-9d2f7d2a308d": "monthly",
};

const FALLBACK_BY_DURATION = new Map(FALLBACK_PLANS.map((plan) => [plan.durationDays, plan]));
const FALLBACK_BY_ID = new Map(FALLBACK_PLANS.map((plan) => [plan.id, plan]));
const TEST_PLAN_IDS = new Set(["test", "e1042858-a403-4524-90ef-46d5d7a3670c"]);

function getPlanDuration(plan) {
  const duration = Number(plan.durationDays ?? plan.duration);
  return Number.isFinite(duration) ? duration : null;
}

function getFallbackPlan(plan) {
  const localId = BACKEND_PLAN_IDS[plan.id] || plan.id;
  const duration = getPlanDuration(plan);
  return FALLBACK_BY_ID.get(localId) || FALLBACK_BY_DURATION.get(duration) || FALLBACK_PLANS[0];
}

export function normalizePlan(plan) {
  if (!plan) return null;

  const fallback = getFallbackPlan(plan);
  const price = Number(plan.price);
  const durationDays = getPlanDuration(plan) ?? fallback.durationDays;

  return {
    ...fallback,
    ...plan,
    id: plan.id || fallback.id,
    localId: BACKEND_PLAN_IDS[plan.id] || fallback.id,
    name: plan.name || fallback.name,
    price: Number.isFinite(price) ? price : fallback.price,
    durationDays,
    period: durationDays === 30 ? "30 dias" : `${durationDays} dias`,
    description: plan.description || fallback.description,
    features: plan.features || fallback.features,
  };
}

export function normalizePlans(plans) {
  if (!Array.isArray(plans)) return [];

  return plans
    .filter((plan) => !TEST_PLAN_IDS.has(plan.id) && Number(plan.price) !== 0.01)
    .map(normalizePlan)
    .filter(Boolean);
}

