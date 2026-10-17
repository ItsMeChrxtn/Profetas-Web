import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[env.cookieName];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
  }
}

/** Populates req.user if a valid cookie is present, but never blocks the request. */
export function attachUserIfPresent(req, res, next) {
  const token = req.cookies?.[env.cookieName];
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, role: payload.role, name: payload.name };
    } catch {
      // ignore invalid/expired token, proceed as a guest
    }
  }
  next();
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
