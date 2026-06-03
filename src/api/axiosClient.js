import axios from "axios";
import { API_BASE, getApiOrigin } from "./routes";

export const AUTH_LOGOUT_EVENT = "auth:logout";

/**
 * baseURL vazio → URLs relativas (/api/v1/...) passam pelo proxy do Vite em dev.
 * Só use VITE_API_ORIGIN se o backend tiver CORS configurado para o front.
 */
const baseURL = getApiOrigin() || "";

export const httpClient = axios.create({
  baseURL,
  withCredentials: true, // HttpOnly cookies
  timeout: 30000,
  headers: { Accept: "application/json" },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (
    config.data &&
    !(config.data instanceof FormData) &&
    !config.headers["Content-Type"]
  ) {
    config.headers["Content-Type"] = "application/json";
  }



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
