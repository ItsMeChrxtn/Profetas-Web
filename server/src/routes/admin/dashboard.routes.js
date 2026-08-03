import { Router } from 'express';
import { getDashboardStats } from '../../controllers/admin/dashboard.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/', requireAdmin, asyncHandler(getDashboardStats));
