import axios from "axios";
import { API_BASE, getApiOrigin } from "./routes";

export const AUTH_LOGOUT_EVENT = "auth:logout";

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
  const token = localStorage.getItem("accessToken");
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

  // Debug: log request details
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
      // Debug: log error details
      console.error("API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        message: error.message,
      });
    }

    if (error.response?.status === 401 && !skipLogout) {
      // Dispatch logout event for AuthContext to handle
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
  const { method = "GET", body, headers, skipAuthLogout, ...rest } = options;

  const res = await httpClient.request({
    url: resolveApiPath(path),
    method,
    data: body,
    headers,
    skipAuthLogout,
    ...rest,
  });

  return res.data;
}
