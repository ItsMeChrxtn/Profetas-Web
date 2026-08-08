import mongoose from 'mongoose';

/**
 * Holds an unverified signup (hashed password + hashed OTP) until the email
 * is confirmed. Nothing here becomes a real User until verifyRegistrationOtp
 * succeeds. The TTL index lets Mongo garbage-collect abandoned signups on its
 * own - no cron needed.
 */
const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    contactNumber: { type: String, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);
