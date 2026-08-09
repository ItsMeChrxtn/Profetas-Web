const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/** Resolves a server-relative upload path (e.g. "/uploads/products/x.jpg")
 * against the API's own origin - needed once the client (Vercel) and API
 * (Render) are on different domains. No-ops for already-absolute URLs, and
 * for local dev / same-origin deploys where VITE_API_URL is unset. */
export function mediaUrl(path) {
  if (!path || /^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}
