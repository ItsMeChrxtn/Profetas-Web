import { Router } from 'express';
import { createInquiry } from '../controllers/wholesale.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const wholesaleRouter = Router();

wholesaleRouter.post('/', requireAuth, asyncHandler(createInquiry));
