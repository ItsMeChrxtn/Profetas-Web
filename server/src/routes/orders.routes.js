import { Router } from 'express';
import { createOrder, getDeliveryQuote, getMyOrders, trackOrderPublic } from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadReceiptImage, verifyImageMagicBytes } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const ordersRouter = Router();

// Public: guests can check an order's status with order number + email.
ordersRouter.get('/track', asyncHandler(trackOrderPublic));

ordersRouter.use(requireAuth);

ordersRouter.post('/', uploadReceiptImage.single('receiptImage'), verifyImageMagicBytes, createOrder);
ordersRouter.post('/delivery-quote', asyncHandler(getDeliveryQuote));
ordersRouter.get('/mine', asyncHandler(getMyOrders));
