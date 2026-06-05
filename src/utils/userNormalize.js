/**
 * Validates and sanitizes avatar URLs to prevent XSS attacks
 * Only allows:
 * - Relative paths starting with /uploads/
 * - HTTPS URLs from trusted domains (google, gravatar, etc)
 * - Data URIs for fallback images
 */
function sanitizeAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Allow data URIs (base64 images)
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // Allow relative paths for uploaded images
  if (trimmed.startsWith("/uploads/")) {
    // Ensure no path traversal attempts
    if (trimmed.includes("..")) return null;
    return trimmed;
  }

  // Allow HTTPS URLs from known safe domains
  try {
    const urlObj = new URL(trimmed);
    
    // Must be HTTPS
    if (urlObj.protocol !== "https:") return null;

    // Whitelist of trusted domains for avatars
    const trustedDomains = [
      "lh3.googleusercontent.com", // Google avatars
      "lh4.googleusercontent.com",
      "lh5.googleusercontent.com",
      "lh6.googleusercontent.com",
      "avatars.githubusercontent.com", // GitHub
      "www.gravatar.com", // Gravatar
      "gravatar.com",
    ];

    const hostname = urlObj.hostname.toLowerCase();
    const isTrusted = trustedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    
    if (isTrusted) {
      return trimmed;
    }
  } catch (err) {
    // Invalid URL format
    console.warn("[sanitizeAvatarUrl] Invalid URL format:", err.message);
  }

  // Reject anything else
  return null;
}

/**
 * Normaliza o usuário do backend Nest para o formato do frontend.
 * Backend: { googleId, email, name, profileImage, role? }
 */
function extractRawUser(data) {
  if (!data || typeof data !== "object") return null;

  const candidates = [
    data.user,
    data.profile,
    data.payload,
    data.result,
    data.data?.user,
    data.data?.profile,
    data.data?.payload,
    typeof data.data === "object" && !Array.isArray(data.data) ? data.data : null,
    data,
  ];

  for (const c of candidates) {
    if (!c || typeof c !== "object" || Array.isArray(c)) continue;
    if (c.email || c.name || c.googleId || c.id || c.profileImage) return c;
  }

  return null;
}

export function normalizeUser(data) {
  // Fallback seguro: tentar diferentes formatos usando extractRawUser
  const rawUser = extractRawUser(data);

  if (!rawUser || typeof rawUser !== "object") {
    console.error("[normalizeUser] Invalid user data:", data);
    return null;
  }

  const id = rawUser.id ?? rawUser.googleId ?? rawUser.sub ?? null;
  const name =
    (typeof rawUser.name === "string" && rawUser.name.trim()) ||
    (typeof rawUser.fullName === "string" && rawUser.fullName.trim()) ||
    [rawUser.firstName, rawUser.lastName].filter(Boolean).join(" ").trim() ||
    null;
  const email = typeof rawUser.email === "string" ? rawUser.email.trim() : null;
  
  let avatarUrl =
    rawUser.profileImage ??
    rawUser.profile_image ??
    rawUser.avatarUrl ??
    rawUser.avatar_url ??
    rawUser.avatar ??
    rawUser.picture ??
    rawUser.pictureUrl ??
    rawUser.photo ??
    rawUser.photoUrl ??
    rawUser.imageUrl ??
    null;

  // Try to recover avatar from sessionStorage (uses sessionStorage for security)
  if (!avatarUrl) {
    try {
      const stored = sessionStorage.getItem("userAvatar");
      if (stored) {
        if (stored.startsWith("{")) {
          const parsed = JSON.parse(stored);
          avatarUrl = parsed?.avatarUrl || parsed?.profileImage || null;
        } else {
          avatarUrl = stored;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Normalize /uploads paths
  if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.includes("/uploads/")) {
    const parts = avatarUrl.split("/uploads/");
    avatarUrl = "/uploads/" + parts[parts.length - 1];
  }

  // Validate and sanitize avatar URL to prevent XSS
  avatarUrl = sanitizeAvatarUrl(avatarUrl);

  if (!id && !email && !name) {
    console.error("[normalizeUser] No valid id, email or name found");
    return null;
  }

  // Suporte robusto a múltiplos formatos de role do backend
  let roleCandidate = rawUser.role ?? rawUser.roleId ?? rawUser.roles ?? rawUser.isAdmin ?? "user";
  
  if (Array.isArray(roleCandidate)) {
    roleCandidate = roleCandidate[0] || "user";
  }
  if (roleCandidate && typeof roleCandidate === "object") {
    roleCandidate = roleCandidate.name ?? roleCandidate.id ?? roleCandidate.role ?? "user";
  }
  if (typeof roleCandidate === "boolean") {
    roleCandidate = roleCandidate ? "admin" : "user";
  }

  const normalizedRole = String(roleCandidate).trim().toUpperCase();

  return {
    id,
    googleId: rawUser.googleId ?? null,
    name: name || null,
    email: email || null,
    avatarUrl: avatarUrl || null,
    role: normalizedRole,
    termos_aceitos: rawUser.termsAccepted ?? rawUser.termos_aceitos ?? false,
  };
}

/** Combina perfil da API + claims do JWT (API tem prioridade). */
export function mergeUserProfiles(...sources) {
  let merged = null;
  for (const src of sources) {
    const isNormalized = src && ("avatarUrl" in src || "termos_aceitos" in src);
    const n = isNormalized ? src : normalizeUser(src);
    if (!n) continue;
    merged = {
      id: n.id ?? merged?.id ?? null,
      googleId: n.googleId ?? merged?.googleId ?? null,
      name: n.name || merged?.name || null,
      email: n.email || merged?.email || null,
      avatarUrl: n.avatarUrl || merged?.avatarUrl || null,
      role: (n.role || merged?.role || "USER").toUpperCase(),
    };
  }
  return merged;
}
