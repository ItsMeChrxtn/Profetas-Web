import { Router } from 'express';
import { listOrders, getOrder, updateOrderStatus, bookCourier } from '../../controllers/admin/orders.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAdmin);

adminOrdersRouter.get('/', asyncHandler(listOrders));
adminOrdersRouter.get('/:id', asyncHandler(getOrder));
adminOrdersRouter.patch('/:id/status', asyncHandler(updateOrderStatus));
adminOrdersRouter.post('/:id/book-courier', asyncHandler(bookCourier));
