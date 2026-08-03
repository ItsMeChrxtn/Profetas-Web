import { Router } from 'express';
import { getPublicSettings } from '../controllers/settings.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsRouter = Router();

settingsRouter.get('/', asyncHandler(getPublicSettings));
