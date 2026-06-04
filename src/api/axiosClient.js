import axios from "axios";
import { API_BASE, getApiOrigin } from "./routes";

export const AUTH_LOGOUT_EVENT = "auth:logout";
export const AUTH_REFRESH_EVENT = "auth:refresh";

/**
 * Retrieves access token from sessionStorage
 * Note: We use sessionStorage instead of localStorage for better security
 * sessionStorage is cleared when browser tab closes and is not accessible to other tabs
 */
function getAccessToken() {
  try {
    return sessionStorage.getItem("accessToken");
  } catch (err) {
    console.error("[axiosClient] Erro ao recuperar credenciais:", err);
    return null;
  }
}

/**
 * baseURL aponta para o backend no Render.
 * withCredentials apenas quando NÃO há Bearer token (modo cookie).
 */
const baseURL = getApiOrigin() || "";

export const httpClient = axios.create({
  baseURL,
  withCredentials: false, // JWT via Bearer — sem cookie cross-site
  timeout: 30000,
  headers: { Accept: "application/json" },
});

httpClient.interceptors.request.use((config) => {
  // Get token from sessionStorage (secure) not localStorage
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Com Bearer token, não precisamos de cookies cross-site
    config.withCredentials = false;
  } else {
    // Sem token: tenta cookie (sessão HttpOnly)
    config.withCredentials = true;
  }

  if (
    config.data &&
    !(config.data instanceof FormData) &&
    !config.headers["Content-Type"]
  ) {
    config.headers["Content-Type"] = "application/json";
  }

  // Debug: log request details (sem expor token)
  console.log("[axiosClient] Request:", {
    url: config.url,
    method: config.method,
    withCredentials: config.withCredentials,
    hasAuthHeader: !!config.headers.Authorization,
  });

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipLogout = error.config?.skipAuthLogout === true;
    const skipConsoleError = error.config?.skipConsoleError === true;

    if (!skipConsoleError) {
      // Debug: log error details (sem expor dados sensíveis)
      console.error("API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
      });
    }

    // Handle 401 Unauthorized - trigger logout
    if (error.response?.status === 401 && !skipLogout) {
      // Dispatch logout event for AuthContext to handle
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }

    // Handle 403 Forbidden - trigger logout (user permissions revoked)
    if (error.response?.status === 403 && !skipLogout) {
      // User authenticated but not authorized - also logout
      console.warn("[axiosClient] Access forbidden (403) - logging out");
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }

    return Promise.reject(error);
  },
);

/** Garante path com prefixo /api/v1 mesmo sem baseURL absoluto */
export function resolveApiPath(path) {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith(API_BASE)) return p;
  return `${API_BASE}${p.replace(/^\/api\/v1/, "")}`;
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers, skipAuthLogout, skipConsoleError, ...rest } = options;

  const res = await httpClient.request({
    url: resolveApiPath(path),
    method,
    data: body,
    headers,
    skipAuthLogout,
    skipConsoleError,
    ...rest,
  });

  return res.data;
}
