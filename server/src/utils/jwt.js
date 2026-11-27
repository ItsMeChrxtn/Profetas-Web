import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** `sid` ties the token to the account's current login, so a newer login elsewhere ends this one. */
export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.firstName, sid: user.sessionId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
