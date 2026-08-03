import { Router } from 'express';
import { getMyLoyalty } from '../controllers/loyalty.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const loyaltyRouter = Router();

loyaltyRouter.get('/mine', requireAuth, asyncHandler(getMyLoyalty));
