import { env, isProduction } from '../config/env.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: SEVEN_DAYS_MS,
};

export function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, cookieOptions);
}

export function clearAuthCookie(res) {
  res.clearCookie(env.cookieName, { httpOnly: true, secure: isProduction, sameSite: 'lax' });
}
