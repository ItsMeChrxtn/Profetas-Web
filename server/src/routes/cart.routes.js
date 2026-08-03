import { Router } from 'express';
import { validateCart, checkCartAdd } from '../controllers/cart.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cartRouter = Router();

cartRouter.post('/validate', asyncHandler(validateCart));
cartRouter.post('/check-add', asyncHandler(checkCartAdd));
