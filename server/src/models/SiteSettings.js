import mongoose from 'mongoose';

// Singleton document - always looked up/created with _id: 'singleton'.
const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    chatStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
    facebookUrl: { type: String, default: '' },
    shopeeUrl: { type: String, default: '' },
    gcashNumber: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: 'updatedAt' } }
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
