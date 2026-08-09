// Trailing slash stripped defensively - if VITE_API_BASE_URL is ever set to
// "https://host.com/" instead of "https://host.com", a naive `${API_BASE}/api...`
// concatenation produces "https://host.com//api..." which every route 404s on.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
