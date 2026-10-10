import mongoose from 'mongoose';

const APPLICATION_STATUSES = ['Pending', 'Approved', 'Rejected'];

/**
 * A customer's request to become a wholesaler. Approving it flips
 * User.isWholesaler on, which unlocks the wholesale catalog and pricing;
 * rejecting it keeps them a regular customer and records why.
 */
const wholesalerApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    contactNumber: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    businessAddress: { type: String, required: true, trim: true, maxlength: 255 },
    validIdImage: { type: String, required: true },
    businessPermitImage: { type: String, default: null },
    proofOfBusinessImage: { type: String, default: null },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'Pending' },
    rejectionReason: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

wholesalerApplicationSchema.index({ user: 1, createdAt: -1 });
wholesalerApplicationSchema.index({ status: 1 });

export const WHOLESALER_APPLICATION_STATUS_VALUES = APPLICATION_STATUSES;
export const WholesalerApplication = mongoose.model('WholesalerApplication', wholesalerApplicationSchema);
