/** Paths relativos — prefixo /api/v1 aplicado em axiosClient */
export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    google: "/auth/google",
    googleProfile: "/auth/google/profile",
  },
  groups: {
    list: "/groups",
    mine: "/groups/me",
    create: "/groups",
  },
  admin: {
    stats: "/admin/stats",
    groups: "/admin/groups",
    approve: (id) => `/admin/groups/${id}/approve`,
    reject: (id) => `/admin/groups/${id}/reject`,
  },
};
