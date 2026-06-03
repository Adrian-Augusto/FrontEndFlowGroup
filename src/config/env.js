const STORAGE_KEY = "octo_google_client_id";

function clean(value) {
  if (value == null || value === "") return "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}

/** Lê VITE_GOOGLE_CLIENT_ID (.env) ou fallback dev no sessionStorage */
export function getGoogleClientId() {
  const fromEnv = clean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  if (fromEnv) return fromEnv;

  try {
    return clean(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return "";
  }
}

export function setGoogleClientIdDev(clientId) {
  const id = clean(clientId);
  if (!id) return;
  sessionStorage.setItem(STORAGE_KEY, id);
}

export function isGoogleConfigured() {
  return getGoogleClientId().length > 10;
}
