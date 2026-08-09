import { env, isProduction } from '../config/env.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// In production the client (Vercel) and API (Render) live on different
// domains, so the cookie must be SameSite=None to be sent on those
// cross-site fetch() calls - which in turn requires Secure (HTTPS, true for
// both platforms). Locally, client and API share an origin via the Vite
// proxy, so Lax + non-secure keeps working over plain http://localhost.
const crossSite = { secure: true, sameSite: 'none' };
const sameSite = { secure: false, sameSite: 'lax' };
const baseCookieOptions = isProduction ? crossSite : sameSite;

export function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, { httpOnly: true, ...baseCookieOptions, maxAge: SEVEN_DAYS_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.cookieName, { httpOnly: true, ...baseCookieOptions });
}
