import { Router } from 'express';
import {
  listProducts,
  getProduct,
  listHarvestedToday,
  listFeatured,
  listBestSellers,
  listPopular,
  listWholesaleProducts,
} from '../controllers/products.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productsRouter = Router();

productsRouter.get('/', asyncHandler(listProducts));
productsRouter.get('/harvested-today', asyncHandler(listHarvestedToday));
productsRouter.get('/featured', asyncHandler(listFeatured));
productsRouter.get('/best-sellers', asyncHandler(listBestSellers));
productsRouter.get('/popular', asyncHandler(listPopular));
productsRouter.get('/wholesale', requireAuth, asyncHandler(listWholesaleProducts));
productsRouter.get('/:id', asyncHandler(getProduct));
