import { Router } from 'express';
import { handleLalamoveWebhook } from '../controllers/webhooks.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const webhooksRouter = Router();

// No requireAuth here - Lalamove's servers call this directly, they don't carry our cookies.
webhooksRouter.post('/lalamove', asyncHandler(handleLalamoveWebhook));
