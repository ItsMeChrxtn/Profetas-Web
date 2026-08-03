import { Router } from 'express';
import { listCustomers } from '../../controllers/admin/customers.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminCustomersRouter = Router();

adminCustomersRouter.use(requireAdmin);
adminCustomersRouter.get('/', asyncHandler(listCustomers));
