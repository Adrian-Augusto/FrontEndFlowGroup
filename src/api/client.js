import { API_ROUTES } from "./routes";
import { apiRequest } from "./axiosClient";
import { GROUP_STATUS, INITIAL_GROUPS, DEFAULT_PHOTO } from "../data/groups";
import { PLATFORM_STATS } from "../data/platform";
import { normalizeGroup, normalizeGroups } from "../utils/groupNormalize";
import { normalizeUser } from "../utils/userNormalize";
import { fileToDataUrl } from "../utils/fileToDataUrl";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const STORAGE_GROUPS = "octo_groups_v3";

function delay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_GROUPS);
    if (raw) return normalizeGroups(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return normalizeGroups(structuredClone(INITIAL_GROUPS));
}

function saveGroups(groups) {
  localStorage.setItem(STORAGE_GROUPS, JSON.stringify(groups));
}

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg);
  }
}

function buildGroupFormData(payload) {
  const form = new FormData();
  const name = (payload.name || payload.title || "").toString().trim();
  const link = (payload.link || "").toString().trim();
  
  // Always append required fields
  form.append("name", name);
  form.append("link", link);
  
  // Append optional fields if non-empty
  const description = (payload.description || "").toString().trim();
  const platform = (payload.platform || "whatsapp").toString().trim();
  
  if (description) form.append("description", description);
  if (platform) form.append("platform", platform);
  
  // Append photo if valid
  if (payload.photoFile instanceof File && payload.photoFile.size > 0) {
    form.append("photo", payload.photoFile);
  }
  
  return form;
}

function normalizeAuthResponse(data) {
  const user = normalizeUser(data);
  const token = data?.accessToken ?? data?.access_token ?? data?.token ?? null;
  return { user, token };
}

export const api = {
  get useMock() {
    return USE_MOCK;
  },

  async register(payload) {
    const data = await request(API_ROUTES.auth.register, {
      method: "POST",
      body: payload,
    });
    return { data: normalizeUser(data) };
  },

  async login(payload) {
    const data = await request(API_ROUTES.auth.login, {
      method: "POST",
      body: payload,
    });
    return normalizeAuthResponse(data);
  },

  /** Perfil autenticado (GET /api/v1/users/me) */
  async getGoogleProfile() {
    const data = await request(API_ROUTES.auth.googleProfile, {
      skipConsoleError: true,
      skipAuthLogout: true,
    });
    // Backend pode retornar {user: {...}} ou apenas o usuário direto
    const user = data?.user || data?.data || data;
    if (!user || typeof user !== "object") {
      throw new Error("Invalid API response: missing user data", { cause: data });
    }
    // Extrai token se disponível (backend pode retornar token na resposta)
    const token = data?.accessToken ?? data?.access_token ?? data?.token ?? null;
    return { data: normalizeUser(user), raw: data, token };
  },

  /** @deprecated use getGoogleProfile */
  async getMe() {
    return api.getGoogleProfile();
  },

  async logout() {
    await request(API_ROUTES.auth.logout, { method: "POST" });
    return { ok: true };
  },

  async getGroups({ status, platform, q } = {}) {
    if (!USE_MOCK) {
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (platform) params.set("platform", platform);
        if (q) params.set("q", q);
        const queryStr = params.toString();
        const url = queryStr ? `${API_ROUTES.groups.list}?${queryStr}` : API_ROUTES.groups.list;
        const json = await request(url);
        const list = json?.data ?? (Array.isArray(json) ? json : []);
        return { data: normalizeGroups(Array.isArray(list) ? list : []) };
      } catch {
        return { data: [] };
      }
    }
    await delay();
    let groups = loadGroups();
    if (status) groups = groups.filter((g) => g.status === status);
    if (platform) groups = groups.filter((g) => g.platform === platform);
    if (q) {
      const n = q.toLowerCase();
      groups = groups.filter(
        (g) =>
          g.title.toLowerCase().includes(n) ||
          g.description.toLowerCase().includes(n),
      );
    }
    return { data: groups };
  },

  async createGroup(payload) {
    if (!USE_MOCK) {
      const result = await request(API_ROUTES.groups.create, {
        method: "POST",
        body: buildGroupFormData(payload),
      });
      // Ensure response is wrapped in { data: ... }
      return result?.data ? result : { data: result };
    }
    await delay();
    const { data: user } = await api.getGoogleProfile();
    let photo = DEFAULT_PHOTO;
    if (payload.photoFile) photo = await fileToDataUrl(payload.photoFile);
    const groups = loadGroups();
    const newGroup = normalizeGroup({
      id: `g${Date.now().toString(36)}`,
      title: payload.title,
      description: payload.description,
      link: payload.link,
      platform: payload.platform,
      photo,
      members: 0,
      status: GROUP_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      createdBy: user
        ? { id: user.id, name: user.name, email: user.email }
        : null,
    });
    groups.unshift(newGroup);
    saveGroups(groups);
    return { data: newGroup };
  },

  async approveGroup(id) {
    if (!USE_MOCK) {
      return request(API_ROUTES.admin.approve(id), { method: "PATCH" });
    }
    await delay();
    const groups = loadGroups();
    const g = groups.find((x) => x.id === id);
    if (g) g.status = GROUP_STATUS.APPROVED;
    saveGroups(groups);
    return { data: g };
  },

  async rejectGroup(id, reason) {
    if (!USE_MOCK) {
      return request(API_ROUTES.admin.reject(id), {
        method: "PATCH",
        body: { reason },
      });
    }
    await delay();
    const groups = loadGroups();
    const g = groups.find((x) => x.id === id);
    if (g) {
      g.status = GROUP_STATUS.REJECTED;
      g.rejectReason = reason;
    }
    saveGroups(groups);
    return { data: g };
  },

  async getAdminStats() {
    if (!USE_MOCK) {
      return request(API_ROUTES.admin.stats);
    }
    await delay(150);
    const groups = loadGroups();
    return {
      data: {
        totalUsers: PLATFORM_STATS.totalUsers,
        activeUsers30d: PLATFORM_STATS.activeUsers30d,
        groups: {
          approved: groups.filter((g) => g.status === GROUP_STATUS.APPROVED).length,
          pending: groups.filter((g) => g.status === GROUP_STATUS.PENDING).length,
          rejected: groups.filter((g) => g.status === GROUP_STATUS.REJECTED).length,
        },
        totalMembers: groups.reduce((s, g) => s + (g.members ?? 0), 0),
      },
    };
  },

  resetMockData() {
    localStorage.removeItem(STORAGE_GROUPS);
    localStorage.removeItem("octo_groups");
  },
};
