import mongoose from 'mongoose';

const loyaltyVoucherSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thresholdAmount: { type: Number, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Available', 'Redeemed'], default: 'Available' },
    issuedAt: { type: Date, default: Date.now },
    redeemedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

loyaltyVoucherSchema.index({ customer: 1, thresholdAmount: 1 }, { unique: true });

export const LOYALTY_THRESHOLDS = [1000, 5000, 10000];
export const LoyaltyVoucher = mongoose.model('LoyaltyVoucher', loyaltyVoucherSchema);
