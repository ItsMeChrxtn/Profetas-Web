import { Router } from 'express';
import { listPendingPayments, listPaymentHistory, reviewPayment } from '../../controllers/admin/payments.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminPaymentsRouter = Router();

adminPaymentsRouter.use(requireAdmin);

adminPaymentsRouter.get('/pending', asyncHandler(listPendingPayments));
adminPaymentsRouter.get('/history', asyncHandler(listPaymentHistory));
adminPaymentsRouter.patch('/:id', asyncHandler(reviewPayment));
