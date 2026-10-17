import { Router } from 'express';
import { getReports } from '../../controllers/admin/reports.controller.js';
import { requireSuperAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminReportsRouter = Router();

adminReportsRouter.get('/', requireSuperAdmin, asyncHandler(getReports));
