import { Router } from 'express';
import { listCustomers, getCustomer, updateCustomerAccount, contactCustomer } from '../../controllers/admin/customers.controller.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminCustomersRouter = Router();

adminCustomersRouter.use(requireAdmin);
adminCustomersRouter.get('/', asyncHandler(listCustomers));
adminCustomersRouter.get('/:id', asyncHandler(getCustomer));
// Managing and contacting customers is super-admin only.
adminCustomersRouter.patch('/:id/account', requireSuperAdmin, asyncHandler(updateCustomerAccount));
adminCustomersRouter.post('/:id/contact', requireSuperAdmin, asyncHandler(contactCustomer));
