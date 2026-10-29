import { Router } from 'express';
import { validateCart, checkCartAdd } from '../controllers/cart.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { attachUserIfPresent } from '../middleware/auth.js';

export const cartRouter = Router();

// Optional login: approved wholesalers get wholesale prices and minimums.
cartRouter.use(attachUserIfPresent);
cartRouter.post('/validate', asyncHandler(validateCart));
cartRouter.post('/check-add', asyncHandler(checkCartAdd));
