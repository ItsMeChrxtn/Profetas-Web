import { Router } from 'express';
import { listInventory } from '../../controllers/admin/inventory.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminInventoryRouter = Router();

adminInventoryRouter.get('/', requireAdmin, asyncHandler(listInventory));
