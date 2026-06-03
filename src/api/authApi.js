import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";
import { normalizeUser } from "../utils/userNormalize";

function normalizeAuthResponse(data) {
  const token =
    data?.accessToken ?? data?.access_token ?? data?.token ?? data?.data?.accessToken ?? null;
  const user = normalizeUser(data);
  return { user, token: typeof token === "string" ? token : null };
}

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg);
  }
}

export const authApi = {
  /** POST /api/v1/auth/login */
  async login({ email, password }) {
    const data = await request(API_ROUTES.auth.login, {
      method: "POST",
      body: { email, password },
    });
    return normalizeAuthResponse(data);
  },

  /** POST /api/v1/auth/logout */
  async logout() {
    return request(API_ROUTES.auth.logout, { method: "POST" });
  },

  /** GET /api/v1/auth/google/profile */
  async getProfile() {
    const data = await request(API_ROUTES.auth.googleProfile);
    return normalizeUser(data);
  },
};
