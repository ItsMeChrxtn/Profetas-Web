import { Router } from 'express';
import { listAdminUsers, createAdminUser, updateAdminRole } from '../../controllers/admin/users.controller.js';
import { requireSuperAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminUsersRouter = Router();

adminUsersRouter.use(requireSuperAdmin);
adminUsersRouter.get('/', asyncHandler(listAdminUsers));
adminUsersRouter.post('/', asyncHandler(createAdminUser));
adminUsersRouter.patch('/:id/role', asyncHandler(updateAdminRole));
