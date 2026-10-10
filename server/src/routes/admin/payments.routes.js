import { Router } from 'express';
import { listPayments, reviewPayment } from '../../controllers/admin/payments.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminPaymentsRouter = Router();

adminPaymentsRouter.use(requireAdmin);

adminPaymentsRouter.get('/', asyncHandler(listPayments));
adminPaymentsRouter.patch('/:id', asyncHandler(reviewPayment));
