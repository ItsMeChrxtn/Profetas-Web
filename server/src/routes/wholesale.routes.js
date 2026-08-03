import { Router } from 'express';
import { createInquiry } from '../controllers/wholesale.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const wholesaleRouter = Router();

wholesaleRouter.post('/', asyncHandler(createInquiry));
