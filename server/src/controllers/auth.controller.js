import validator from 'validator';
import { User, PendingRegistration } from '../models/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';
import { sendEmail } from '../utils/brevoEmail.js';
import { generateOtp } from '../utils/otp.js';
import { HttpError } from '../utils/httpError.js';
import { isProduction } from '../config/env.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;

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

function otpEmailHtml(firstName, otp) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1B3C26;">Verify your email</h2>
      <p>Hi ${firstName},</p>
      <p>Use this code to finish creating your Profetas Farm account:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color:#1B3C26;">${otp}</p>
      <p style="color:#6B7280; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

/** Step 1 of signup: validate + stash the (hashed) registration, email an OTP. No User row yet. */
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

  const normalizedEmail = email?.trim().toLowerCase();

  if (errors.length === 0) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) errors.push('An account with that email already exists.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  const otp = generateOtp();
  const [passwordHash, otpHash] = await Promise.all([hashPassword(password), hashPassword(otp)]);

  await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactNumber: contactNumber?.trim() || undefined,
      passwordHash,
      otpHash,
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
    { upsert: true }
  );

  if (!isProduction) console.log(`[DEV] OTP for ${normalizedEmail}: ${otp}`);

  await sendEmail({
    to: normalizedEmail,
    subject: 'Verify your Profetas Farm account',
    htmlContent: otpEmailHtml(firstName.trim(), otp),
  });

  res.json({ success: true, message: `We sent a verification code to ${normalizedEmail}.`, email: normalizedEmail });
}

/** Step 2 of signup: OTP check creates the real User and logs them in. */
export async function verifyRegistrationOtp(req, res) {
  const { email, otp } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !otp) {
    throw new HttpError(400, 'Please enter the verification code.');
  }

  const pending = await PendingRegistration.findOne({ email: normalizedEmail });
  if (!pending || pending.expiresAt < new Date()) {
    throw new HttpError(400, 'That code has expired. Please request a new one.');
  }

  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    throw new HttpError(400, 'Too many incorrect attempts. Please request a new code.');
  }

  const valid = await verifyPassword(String(otp).trim(), pending.otpHash);
  if (!valid) {
    pending.attempts += 1;
    await pending.save();
    throw new HttpError(400, 'Incorrect verification code.');
  }

  const user = await User.create({
    firstName: pending.firstName,
    lastName: pending.lastName,
    email: pending.email,
    passwordHash: pending.passwordHash,
    contactNumber: pending.contactNumber,
    role: 'customer',
  });

  await PendingRegistration.deleteOne({ _id: pending._id });

  setAuthCookie(res, signToken(user));
  res.status(201).json({ success: true, message: `Welcome to Profetas Farm, ${user.firstName}!`, user: publicUser(user) });
}

export async function resendRegistrationOtp(req, res) {
  const { email } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  const pending = await PendingRegistration.findOne({ email: normalizedEmail });
  if (!pending) {
    throw new HttpError(400, 'No pending registration found for that email. Please sign up again.');
  }

  if (Date.now() - pending.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new HttpError(429, 'Please wait a moment before requesting another code.');
  }

  const otp = generateOtp();
  pending.otpHash = await hashPassword(otp);
  pending.attempts = 0;
  pending.lastSentAt = new Date();
  pending.expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await pending.save();

  if (!isProduction) console.log(`[DEV] OTP for ${normalizedEmail}: ${otp}`);

  await sendEmail({
    to: normalizedEmail,
    subject: 'Your new Profetas Farm verification code',
    htmlContent: otpEmailHtml(pending.firstName, otp),
  });

  res.json({ success: true, message: `We sent a new code to ${normalizedEmail}.` });
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
