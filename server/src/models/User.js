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
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    // Set when an admin approves a WholesalerApplication; unlocks wholesale pricing.
    isWholesaler: { type: Boolean, default: false },
    businessName: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const User = mongoose.model('User', userSchema);
