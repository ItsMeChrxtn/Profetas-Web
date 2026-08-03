import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Minimal payload by design - requireAuth only verifies the signature, never hits the DB. */
export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.firstName },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
