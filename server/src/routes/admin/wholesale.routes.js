import { Router } from 'express';
import { listApplications, reviewApplication } from '../../controllers/wholesaler.controller.js';
import { requireSuperAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminWholesaleRouter = Router();

adminWholesaleRouter.use(requireSuperAdmin);

adminWholesaleRouter.get('/', asyncHandler(listApplications));
adminWholesaleRouter.patch('/:id', asyncHandler(reviewApplication));
