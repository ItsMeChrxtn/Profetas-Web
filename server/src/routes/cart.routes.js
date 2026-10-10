import { Router } from 'express';
import { validateCart, checkCartAdd } from '../controllers/cart.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { attachUserIfPresent } from '../middleware/auth.js';

export const cartRouter = Router();

// Optional login: approved wholesalers see wholesale prices.
cartRouter.post('/validate', attachUserIfPresent, asyncHandler(validateCart));
cartRouter.post('/check-add', asyncHandler(checkCartAdd));
