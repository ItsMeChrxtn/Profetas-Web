import { Router } from 'express';
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  listArchivedProducts,
  restoreProduct,
  deleteProductPermanently,
  adjustStock,
} from '../../controllers/admin/products.controller.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import { uploadProductImage, verifyImageMagicBytes } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminProductsRouter = Router();

adminProductsRouter.use(requireAdmin);

adminProductsRouter.get('/', asyncHandler(listAdminProducts));
adminProductsRouter.post('/', uploadProductImage.single('image'), verifyImageMagicBytes, createProduct);
adminProductsRouter.put('/:id', uploadProductImage.single('image'), verifyImageMagicBytes, updateProduct);
adminProductsRouter.patch('/:id/stock', asyncHandler(adjustStock));
adminProductsRouter.post('/:id/archive', asyncHandler(archiveProduct));

// Product Archive - super admin only.
adminProductsRouter.get('/archive/list', requireSuperAdmin, asyncHandler(listArchivedProducts));
adminProductsRouter.post('/:id/restore', requireSuperAdmin, asyncHandler(restoreProduct));
adminProductsRouter.delete('/:id/permanent', requireSuperAdmin, asyncHandler(deleteProductPermanently));
