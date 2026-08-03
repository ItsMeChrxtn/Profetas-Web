import { Router } from 'express';
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from '../../controllers/admin/products.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadProductImage, verifyImageMagicBytes } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminProductsRouter = Router();

adminProductsRouter.use(requireAdmin);

adminProductsRouter.get('/', asyncHandler(listAdminProducts));
adminProductsRouter.post('/', uploadProductImage.single('image'), verifyImageMagicBytes, createProduct);
adminProductsRouter.put('/:id', uploadProductImage.single('image'), verifyImageMagicBytes, updateProduct);
adminProductsRouter.delete('/:id', asyncHandler(deleteProduct));
adminProductsRouter.patch('/:id/stock', asyncHandler(adjustStock));
