import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  changePassword,
  addLandingImage,
  removeLandingImage,
  updateLandingContent,
} from '../../controllers/admin/settings.controller.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import { uploadSiteImage, verifyImageMagicBytes } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdmin);

adminSettingsRouter.get('/', asyncHandler(getSettings));
adminSettingsRouter.put('/', asyncHandler(updateSettings));
adminSettingsRouter.get('/profile', asyncHandler(getProfile));
adminSettingsRouter.put('/profile', asyncHandler(updateProfile));
adminSettingsRouter.put('/profile/password', asyncHandler(changePassword));
// Landing page content is super-admin only.
adminSettingsRouter.post('/landing/images', requireSuperAdmin, uploadSiteImage.single('image'), verifyImageMagicBytes, addLandingImage);
adminSettingsRouter.post('/landing/images/remove', requireSuperAdmin, asyncHandler(removeLandingImage));
adminSettingsRouter.put('/landing', requireSuperAdmin, asyncHandler(updateLandingContent));
