/**
 * Security validators for common attack vectors
 * - Open redirects
 * - XSS attacks  
 * - CSRF tokens
 * - URL validation
 */

/**
 * Validates that a redirect URL is safe (internal only)
 * Prevents open redirect vulnerabilities
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is safe to redirect to
 */
export function isSafeRedirectUrl(url) {
  if (!url || typeof url !== "string") return false;

  const cleanUrl = url.trim();

  // Must start with /
  if (!cleanUrl.startsWith("/")) return false;

  // Block protocol-relative URLs (//evil.com)
  if (cleanUrl.match(/^\/\//)) return false;

  // Block protocol URLs (javascript:, data:, http://, etc)
  if (cleanUrl.match(/^[a-z]+:/i)) return false;

  // Block common open redirect patterns
  if (cleanUrl.match(/['"\\]/)) return false;

  return true;
}

/**
 * Sanitizes avatar/image URLs to prevent XSS
 * Only allows relative paths and HTTPS URLs from trusted domains
 * 
 * @param {string} url - The URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Allow relative paths for uploaded images
  if (trimmed.startsWith("/uploads/")) {
    // Prevent path traversal
    if (trimmed.includes("..")) return null;
    return trimmed;
  }

  // Allow HTTPS URLs from whitelisted domains
  try {
    const urlObj = new URL(trimmed);

    // Must be HTTPS
    if (urlObj.protocol !== "https:") return null;

    // Whitelist of trusted domains
    const trustedDomains = [
      "lh3.googleusercontent.com",
      "lh4.googleusercontent.com",
      "lh5.googleusercontent.com",
      "lh6.googleusercontent.com",
      "avatars.githubusercontent.com",
      "www.gravatar.com",
      "gravatar.com",
    ];

    const hostname = urlObj.hostname.toLowerCase();
    const isTrusted = trustedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    return isTrusted ? trimmed : null;
  } catch (err) {
    return null;
  }
}

/**
 * Validates external links to prevent open redirects
 * Used for group links, external URLs, etc.
 * 
 * @param {string} url - The URL to validate  
 * @returns {boolean} - True if the URL is valid
 */
export function isValidExternalUrl(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const urlObj = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(urlObj.protocol)) return false;

    // Reject localhost and private IPs
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Escapes HTML special characters to prevent XSS
 * 
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text safe for HTML context
 */
export function escapeHtml(text) {
  if (!text || typeof text !== "string") return "";

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitizes user input text for display (removes potential XSS vectors)
 * Use this for user-generated content like group descriptions, names, etc.
 * 
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeUserText(text) {
  if (!text || typeof text !== "string") return "";

  // Remove dangerous HTML/JS patterns
  let sanitized = text
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers (onclick=, onerror=, etc)
    .trim();

  return sanitized;
}

/**
 * Validates email format
 * 
 * @param {string} email - The email to validate
 * @returns {boolean} - True if the email appears valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Checks if a value is suspicious JSON that might indicate XSS
 * 
 * @param {string} value - The value to check
 * @returns {boolean} - True if suspicious
 */
export function isSuspiciousJson(value) {
  if (!value || typeof value !== "string") return false;

  // Check for common XSS patterns in strings
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(value));
}
