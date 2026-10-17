import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    passwordHash: { type: String, required: true },
    contactNumber: { type: String, trim: true, maxlength: 20 },
    // superadmin: full access (reports, archive, user management, landing page).
    // admin: day-to-day operations only.
    role: { type: String, enum: ['superadmin', 'admin', 'customer'], default: 'customer' },
    // Set when an admin approves a WholesalerApplication; unlocks wholesale pricing.
    isWholesaler: { type: Boolean, default: false },
    businessName: { type: String, trim: true, maxlength: 120 },
    // Super admins can suspend a customer; a suspended account cannot log in or order.
    accountStatus: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
    suspensionReason: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
    // Suspensions, reinstatements and warnings, newest last.
    accountHistory: {
      type: [
        {
          action: { type: String, enum: ['Suspended', 'Unsuspended', 'Warning', 'Emailed'] },
          reason: String,
          by: String,
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const ADMIN_ROLES = ['superadmin', 'admin'];
export const User = mongoose.model('User', userSchema);
