import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

const SIGNED_IN_ELSEWHERE = 'Your account was signed in on another device, so you were logged out here. Please log in again.';

/** The token's user, or null when the token is missing, expired, or replaced by a newer login. */
async function sessionUser(req) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return { error: 'Please log in to continue.' };
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return { error: 'Your session has expired. Please log in again.' };
  }
  const account = await User.findById(payload.sub).select('sessionId accountStatus').lean();
  if (!account || !payload.sid || account.sessionId !== payload.sid) return { error: SIGNED_IN_ELSEWHERE };
  if (account.accountStatus === 'Suspended') return { error: 'This account has been suspended.' };
  return { user: { id: payload.sub, role: payload.role, name: payload.name } };
}

export function requireAuth(req, res, next) {
  sessionUser(req)
    .then(({ user, error }) => {
      if (error) return res.status(401).json({ success: false, message: error });
      req.user = user;
      next();
    })
    .catch(next);
}

/** Populates req.user if a valid cookie is present, but never blocks the request. */
export function attachUserIfPresent(req, res, next) {
  if (!req.cookies?.[env.cookieName]) return next();
  sessionUser(req)
    .then(({ user }) => {
      if (user) req.user = user; // otherwise continue as a guest
      next();
    })
    .catch(next);
}

const ADMIN_ROLES = ['superadmin', 'admin'];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

/** Admins and super admins. */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
  });
}

/** Super admins only - reports, product archive, user management, landing page. */
export function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only the super admin can do this.' });
    }
    next();
  });
}
