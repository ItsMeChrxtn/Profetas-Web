import { Router } from 'express';
import { listAdminInquiries, updateInquiry } from '../../controllers/admin/wholesale.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminWholesaleRouter = Router();

adminWholesaleRouter.use(requireAdmin);

adminWholesaleRouter.get('/', asyncHandler(listAdminInquiries));
adminWholesaleRouter.patch('/:id', asyncHandler(updateInquiry));
