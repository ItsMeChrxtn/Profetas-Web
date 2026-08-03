import mongoose from 'mongoose';

const WHOLESALE_STATUSES = ['New', 'Quoted', 'Closed'];

const wholesaleInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    contactNumber: { type: String, required: true, trim: true, maxlength: 20 },
    location: { type: String, required: true, trim: true, maxlength: 255 },
    requestedItems: { type: String, required: true },
    estimatedBudget: { type: Number, default: null },
    status: { type: String, enum: WHOLESALE_STATUSES, default: 'New' },
    adminResponse: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const WHOLESALE_STATUS_VALUES = WHOLESALE_STATUSES;
export const WholesaleInquiry = mongoose.model('WholesaleInquiry', wholesaleInquirySchema);
