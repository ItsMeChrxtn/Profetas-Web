import { Router } from 'express';
import { listAdminFarmVisits, updateFarmVisitStatus } from '../../controllers/admin/farmVisits.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminFarmVisitsRouter = Router();

adminFarmVisitsRouter.use(requireAdmin);

adminFarmVisitsRouter.get('/', asyncHandler(listAdminFarmVisits));
adminFarmVisitsRouter.patch('/:id/status', asyncHandler(updateFarmVisitStatus));
