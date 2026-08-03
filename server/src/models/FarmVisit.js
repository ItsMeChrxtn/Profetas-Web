import mongoose from 'mongoose';

const FARM_VISIT_STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

const farmVisitSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    contactNumber: { type: String, required: true, trim: true, maxlength: 20 },
    visitDate: { type: String, required: true },
    visitTime: { type: String, required: true },
    numberOfVisitors: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: FARM_VISIT_STATUSES, default: 'Pending' },
    notes: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

farmVisitSchema.index({ visitDate: 1, visitTime: 1 });

export const FARM_VISIT_STATUS_VALUES = FARM_VISIT_STATUSES;
export const FarmVisit = mongoose.model('FarmVisit', farmVisitSchema);
