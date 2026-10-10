import { Router } from 'express';
import { listApplications, reviewApplication } from '../../controllers/wholesaler.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminWholesaleRouter = Router();

adminWholesaleRouter.use(requireAdmin);

adminWholesaleRouter.get('/', asyncHandler(listApplications));
adminWholesaleRouter.patch('/:id', asyncHandler(reviewApplication));
