import mongoose from 'mongoose';

// Singleton document - always looked up/created with _id: 'singleton'.
const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
    chatStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
    facebookUrl: { type: String, default: '' },
    shopeeUrl: { type: String, default: '' },
    gcashNumber: { type: String, default: '' },
    // Landing page content the admin can change from Settings.
    heroImages: { type: [String], default: [] },
    glimpseImages: { type: [{ image: String, caption: String }], default: [] },
    aboutText: { type: String, default: '' },
    aboutImage: { type: String, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: 'updatedAt' } }
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
