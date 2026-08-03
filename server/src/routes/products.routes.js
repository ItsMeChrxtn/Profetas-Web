import { Router } from 'express';
import { listProducts, getProduct, listHarvestedToday, listFeatured } from '../controllers/products.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productsRouter = Router();

productsRouter.get('/', asyncHandler(listProducts));
productsRouter.get('/harvested-today', asyncHandler(listHarvestedToday));
productsRouter.get('/featured', asyncHandler(listFeatured));
productsRouter.get('/:id', asyncHandler(getProduct));
