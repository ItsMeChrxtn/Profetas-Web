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
import { requireAdmin } from '../../middleware/auth.js';
import { uploadSiteImage, verifyImageMagicBytes } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdmin);

adminSettingsRouter.get('/', asyncHandler(getSettings));
adminSettingsRouter.put('/', asyncHandler(updateSettings));
adminSettingsRouter.get('/profile', asyncHandler(getProfile));
adminSettingsRouter.put('/profile', asyncHandler(updateProfile));
adminSettingsRouter.put('/profile/password', asyncHandler(changePassword));
adminSettingsRouter.post('/landing/images', uploadSiteImage.single('image'), verifyImageMagicBytes, addLandingImage);
adminSettingsRouter.post('/landing/images/remove', asyncHandler(removeLandingImage));
adminSettingsRouter.put('/landing', asyncHandler(updateLandingContent));
