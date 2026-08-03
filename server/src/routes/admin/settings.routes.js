import { Router } from 'express';
import { getSettings, updateSettings, getProfile, updateProfile, changePassword } from '../../controllers/admin/settings.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdmin);

adminSettingsRouter.get('/', asyncHandler(getSettings));
adminSettingsRouter.put('/', asyncHandler(updateSettings));
adminSettingsRouter.get('/profile', asyncHandler(getProfile));
adminSettingsRouter.put('/profile', asyncHandler(updateProfile));
adminSettingsRouter.put('/profile/password', asyncHandler(changePassword));
