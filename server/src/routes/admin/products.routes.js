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
// Adding, editing, stock changes and archiving are super-admin only; admins can view.
adminProductsRouter.post('/', requireSuperAdmin, uploadProductImage.single('image'), verifyImageMagicBytes, createProduct);
adminProductsRouter.put('/:id', requireSuperAdmin, uploadProductImage.single('image'), verifyImageMagicBytes, updateProduct);
adminProductsRouter.patch('/:id/stock', requireSuperAdmin, asyncHandler(adjustStock));
adminProductsRouter.post('/:id/archive', requireSuperAdmin, asyncHandler(archiveProduct));

// Product Archive - super admin only.
adminProductsRouter.get('/archive/list', requireSuperAdmin, asyncHandler(listArchivedProducts));
adminProductsRouter.post('/:id/restore', requireSuperAdmin, asyncHandler(restoreProduct));
adminProductsRouter.delete('/:id/permanent', requireSuperAdmin, asyncHandler(deleteProductPermanently));
