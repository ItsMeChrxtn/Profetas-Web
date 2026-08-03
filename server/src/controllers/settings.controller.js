import { SiteSettings } from '../models/index.js';

const DEFAULTS = { chatStatus: 'offline', facebookUrl: '', shopeeUrl: '', gcashNumber: '' };

export async function getPublicSettings(req, res) {
  const settings = await SiteSettings.findById('singleton');
  res.json({
    success: true,
    settings: {
      chatStatus: settings?.chatStatus ?? DEFAULTS.chatStatus,
      facebookUrl: settings?.facebookUrl ?? DEFAULTS.facebookUrl,
      shopeeUrl: settings?.shopeeUrl ?? DEFAULTS.shopeeUrl,
      gcashNumber: settings?.gcashNumber ?? DEFAULTS.gcashNumber,
    },
  });
}
