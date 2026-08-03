import { Router } from 'express';
import { listAdminPosts, createPost, updatePost, deletePost } from '../../controllers/admin/education.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadEducationImage, verifyImageMagicBytes } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminEducationRouter = Router();

adminEducationRouter.use(requireAdmin);

adminEducationRouter.get('/', asyncHandler(listAdminPosts));
adminEducationRouter.post('/', uploadEducationImage.single('image'), verifyImageMagicBytes, createPost);
adminEducationRouter.put('/:id', uploadEducationImage.single('image'), verifyImageMagicBytes, updatePost);
adminEducationRouter.delete('/:id', asyncHandler(deletePost));
