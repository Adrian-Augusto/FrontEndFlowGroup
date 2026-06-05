import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";
import { GROUP_STATUS, INITIAL_GROUPS } from "../data/groups";
import { PLATFORM_STATS } from "../data/platform";
import { normalizeGroups } from "../utils/groupNormalize";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_GROUPS = "octo_groups_v4";

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadMockGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_GROUPS);
    if (raw) return normalizeGroups(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return normalizeGroups(structuredClone(INITIAL_GROUPS));
}

function unwrapGroups(data) {
  // Try multiple paths to find the array
  const candidates = [
    data?.data,
    data?.groups,
    data?.result,
    data?.items,
    Array.isArray(data) ? data : null,
  ].filter(Boolean);
  
  let list = candidates.find(c => Array.isArray(c));
  if (!list) {
    console.warn("[AdminAPI] Could not find array in response:", data);
    list = [];
  }
  
  return normalizeGroups(Array.isArray(list) ? list : []);
}

function normalizeStats(data) {
  const raw = data?.data ?? data ?? {};
  const groups = raw.groups ?? raw.groupStats ?? {};

  return {
    totalUsers: raw.totalUsers ?? raw.users?.total ?? 0,
    activeUsers30d: raw.activeUsers30d ?? raw.users?.active30d ?? 0,
    groups: {
      approved: groups.approved ?? groups.approvedCount ?? 0,
      pending: groups.pending ?? groups.pendingCount ?? 0,
      rejected: groups.rejected ?? groups.rejectedCount ?? 0,
    },
    totalMembers: raw.totalMembers ?? 0,
  };
}

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg, { cause: err });
  }
}

export const adminApi = {
  async getStats() {
    if (!USE_MOCK) {
      let data;
      try {
        data = await request(API_ROUTES.admin.stats);
      } catch {
        data = await request(API_ROUTES.admin.groupsStats);
      }
      return normalizeStats(data);
    }
    await delay(150);
    const groups = loadMockGroups();
    return {
      totalUsers: PLATFORM_STATS.totalUsers,
      activeUsers30d: PLATFORM_STATS.activeUsers30d,
      groups: {
        approved: groups.filter((g) => g.status === GROUP_STATUS.APPROVED).length,
        pending: groups.filter((g) => g.status === GROUP_STATUS.PENDING).length,
        rejected: groups.filter((g) => g.status === GROUP_STATUS.REJECTED).length,
      },
      totalMembers: groups.reduce((s, g) => s + (g.members ?? 0), 0),
    };
  },

  /** GET /api/v1/admin/groups?status= */
  async listGroups({ status } = {}) {
    if (!USE_MOCK) {
      const q = status ? `?status=${encodeURIComponent(status)}` : "";
      const data = await request(`${API_ROUTES.admin.groups}${q}`);
      return unwrapGroups(data);
    }
    await delay();
    let groups = loadMockGroups();
    if (status) groups = groups.filter((g) => g.status === status);
    return groups;
  },

  async approve(id) {
    if (!USE_MOCK) {
      return request(API_ROUTES.admin.approve(id), { method: "PATCH" });
    }
    await delay();
    const groups = loadMockGroups();
    const g = groups.find((x) => x.id === id);
    if (g) g.status = GROUP_STATUS.APPROVED;
    localStorage.setItem(STORAGE_GROUPS, JSON.stringify(groups));
    return g;
  },

  async reject(id, reason) {
    if (!USE_MOCK) {
      return request(API_ROUTES.admin.reject(id), {
        method: "PATCH",
        body: reason ? { reason } : {},
      });
    }
    await delay();
    const groups = loadMockGroups();
    const g = groups.find((x) => x.id === id);
    if (g) {
      g.status = GROUP_STATUS.REJECTED;
      g.rejectReason = reason;
    }
    localStorage.setItem(STORAGE_GROUPS, JSON.stringify(groups));
    return g;
  },

  async delete(id) {
    if (!USE_MOCK) {
      return request(API_ROUTES.admin.delete(id), { method: "DELETE" });
    }
    await delay();
    const groups = loadMockGroups();
    const index = groups.findIndex((x) => x.id === id);
    if (index !== -1) {
      const deleted = groups.splice(index, 1);
      localStorage.setItem(STORAGE_GROUPS, JSON.stringify(groups));
      return deleted[0];
    }
    throw new Error("Grupo não encontrado");
  },
};
