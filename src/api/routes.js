/**
 * Contrato REST alinhado ao backend FlowGroup.
 * Base padrão: /api/v1 (Nest na porta 8080).
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");
export const DEFAULT_API_ORIGIN = "https://allgrops.onrender.com";

/** Monta path tipo /api/auth/google ou /auth/google se API_BASE vazio */
export function apiPath(...segments) {
  const parts = [API_BASE.replace(/^\//, ""), ...segments].filter(Boolean);
  return `/${parts.join("/")}`;
}

export function getApiOrigin() {
  return import.meta.env.VITE_API_ORIGIN?.trim() || DEFAULT_API_ORIGIN;
}

export const API_ROUTES = {
  auth: {
    register: apiPath("auth", "register"),
    login: apiPath("auth", "login"),
    google: apiPath("auth", "google"),
    googleCallback: apiPath("auth", "google", "callback"),
    googleProfile: apiPath("users", "me"),
    logout: apiPath("auth", "logout"),
  },
  groups: {
    list: apiPath("groups"),
    mine: apiPath("groups", "me"),
    limits: apiPath("subscriptions", "limits"),
    byId: (id) => apiPath("groups", id),
    create: apiPath("groups"),
    update: (id) => apiPath("groups", id),
    delete: (id) => apiPath("groups", id),
    join: (id) => apiPath("groups", id, "join"),
  },
  upload: {
    groupPhoto: apiPath("upload", "group-photo"),
  },
  admin: {
    groups: apiPath("admin", "groups"),
    groupsPending: `${apiPath("admin", "groups")}?status=pending`,
    groupsAll: apiPath("admin", "groups"),
    approve: (id) => apiPath("admin", "groups", id, "approve"),
    reject: (id) => apiPath("admin", "groups", id, "reject"),
    delete: (id) => apiPath("admin", "groups", id),
    stats: apiPath("admin", "stats"),
    users: apiPath("admin", "users"),
  },
  platforms: {
    list: apiPath("platforms"),
  },
  categories: {
    list: apiPath("categories"),
    byId: (id) => apiPath("categories", id),
  },
  payments: {
    create: apiPath("payments", "create"),
    status: apiPath("payments", "status"),
    history: apiPath("payments", "history"),
    webhook: apiPath("payments", "webhook"),
  },
  plans: {
    list: apiPath("plans"),
    subscribe: apiPath("plans", "subscribe"),
    me: apiPath("plans", "me"),
    active: apiPath("plans", "active"),
    cancel: apiPath("plans", "cancel"),
    featuredGroups: apiPath("plans", "featured-groups"),
  },
  terms: {
    version: apiPath("terms", "version"),
    content: apiPath("terms", "content"),
    status: apiPath("terms", "status"),
    accept: apiPath("terms", "accept"),
  },
};

/**
 * URL para iniciar OAuth — navega diretamente ao backend no Render.
 * VITE_AUTH_GOOGLE_URL — override total, ex. https://allgrops.onrender.com/api/v1/auth/google
 * VITE_AUTH_REDIRECT_PARAM — nome do query (redirect, callbackUrl, …); vazio = sem query
 */
export function getGoogleLoginUrl() {
  const override = import.meta.env.VITE_AUTH_GOOGLE_URL?.trim();
  // Sempre usa o backend do Render como base — nunca localhost
  const backendOrigin = import.meta.env.VITE_API_ORIGIN?.trim() || DEFAULT_API_ORIGIN;
  const path = override || API_ROUTES.auth.google;

  const base = backendOrigin.replace(/\/$/, "");
  const url = path.startsWith("http")
    ? new URL(path)
    : new URL(path.startsWith("/") ? path : `/${path}`, base);

  const redirectParam = import.meta.env.VITE_AUTH_REDIRECT_PARAM?.trim();
  const param = redirectParam || "redirect";
  const callback = new URL("/auth/callback", window.location.origin);
  url.searchParams.set(param, callback.toString());

  return url.href;
}

/** Documentação — paths relativos a API_BASE (/api/v1) */
export const API_ROUTE_DOCS = [
  {
    tag: "Auth",
    description: "Autenticação — cookies HttpOnly após login",
    routes: [
      {
        method: "POST",
        path: "/auth/register",
        body: "{ name, email, password }",
        response: "{ user }",
      },
      {
        method: "POST",
        path: "/auth/login",
        body: "{ email, password }",
        response: "{ user }",
        note: "Set-Cookie de sessão.",
      },
      {
        method: "GET",
        path: "/auth/google",
        response: "302 → Google OAuth",
        note: "Query opcional: ?redirect=URL_do_frontend/auth/callback",
      },
      {
        method: "GET",
        path: "/auth/google/callback",
        response: "302 → frontend com cookie de sessão",
        note: "Callback do Google no servidor.",
      },
      {
        method: "GET",
        path: "/auth/google/profile",
        auth: "cookie",
        response: "{ user }",
        note: "Perfil do usuário logado (substitui /auth/me).",
      },
      {
        method: "POST",
        path: "/auth/logout",
        auth: "cookie",
        response: "{ ok: true }",
      },
    ],
  },
  {
    tag: "Groups",
    description: "Grupos externos (WhatsApp, Telegram…)",
    routes: [
      {
        method: "GET",
        path: "/groups",
        query: "?q=&platform=&page=1&limit=20",
        response: "{ data: GroupPost[] }",
      },
      {
        method: "POST",
        path: "/groups",
        auth: "cookie",
        body: "multipart: title, description, link, platform, photo",
        response: "{ data: GroupPost }",
      },
      {
        method: "GET",
        path: "/groups/me",
        auth: "cookie",
        response: "{ data: GroupPost[] }",
        note: "Meus grupos (usuário logado).",
      },
    ],
  },
  {
    tag: "Admin",
    description: "Moderação",
    routes: [
      { method: "GET", path: "/admin/stats", auth: "admin", response: "{ ... }" },
      { method: "GET", path: "/admin/groups", auth: "admin", query: "?status=" },
      { method: "PATCH", path: "/admin/groups/:id/approve", auth: "admin" },
      { method: "PATCH", path: "/admin/groups/:id/reject", auth: "admin" },
    ],
  },
  {
    tag: "Plans",
    description: "Anúncio no topo (planos semanal/mensal)",
    routes: [
      { method: "GET", path: "/plans", response: "{ data: Plan[] }" },
      { method: "POST", path: "/plans/subscribe", auth: "cookie", body: "{ planId }" },
    ],
  },
  {
    tag: "Terms",
    description: "Termos e Condições — aceitação obrigatória pós-login",
    routes: [
      { 
        method: "GET", 
        path: "/terms/version", 
        response: "{ version: number }",
        note: "Versão atual dos termos."
      },
      { 
        method: "GET", 
        path: "/terms/content", 
        response: "{ content: string }",
        note: "Conteúdo completo dos termos (HTML ou texto)."
      },
      { 
        method: "GET", 
        path: "/terms/status", 
        auth: "cookie",
        response: "{ accepted: boolean, acceptedVersion: number, acceptedAt: string }",
        note: "Verifica se usuário já aceitou os termos."
      },
      { 
        method: "POST", 
        path: "/terms/accept", 
        auth: "cookie",
        body: "{ accepted: true }",
        response: "{ ok: true }",
        note: "Registra aceitação dos termos pelo usuário."
      },
    ],
  },
];
