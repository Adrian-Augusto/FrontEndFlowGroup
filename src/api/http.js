/**
 * Fetch com cookies de sessão (HttpOnly) enviados pelo backend.
 * O frontend NUNCA lê nem grava access_token — apenas credentials: 'include'.
 */
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "";

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
  const { headers: customHeaders, body, ...rest } = options;

  const headers = { ...customHeaders };
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] ??= "application/json";
  }

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers,
    body:
      body !== undefined && headers["Content-Type"] === "application/json" && typeof body !== "string"
        ? JSON.stringify(body)
        : body,
  });

  return res;
}

export async function parseJson(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida do servidor");
  }
}
