import { Router } from 'express';
import { createOrder, getMyOrders } from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadReceiptImage, verifyImageMagicBytes } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.post('/', uploadReceiptImage.single('receiptImage'), verifyImageMagicBytes, createOrder);
ordersRouter.get('/mine', asyncHandler(getMyOrders));
