import validator from 'validator';
import { User } from '../models/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';

function publicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    contactNumber: user.contactNumber,
    role: user.role,
  };
}

export async function register(req, res) {
  const { firstName, lastName, email, contactNumber, password, confirmPassword } = req.body;
  const errors = [];

  if (!firstName?.trim()) errors.push('First name is required.');
  if (!lastName?.trim()) errors.push('Last name is required.');
  if (!email?.trim()) {
    errors.push('Email is required.');
  } else if (!validator.isEmail(email)) {
    errors.push('Please enter a valid email address.');
  }
  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (errors.length === 0) {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) errors.push('An account with that email already exists.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    contactNumber: contactNumber?.trim() || undefined,
    role: 'customer',
  });

  setAuthCookie(res, signToken(user));
  res.status(201).json({ success: true, message: `Welcome to Profetas Farm, ${user.firstName}!`, user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const genericError = 'Incorrect email or password.';

  if (!email || !password) {
    return res.status(400).json({ success: false, message: genericError });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: genericError });
  }

  setAuthCookie(res, signToken(user));
  res.json({ success: true, user: publicUser(user) });
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.json({ success: true });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  res.json({ success: true, user: publicUser(user) });
}
