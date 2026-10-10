import { Router } from 'express';
import { getMyApplication, submitApplication } from '../controllers/wholesaler.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadWholesaleDocs, verifyImageMagicBytes } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const wholesaleRouter = Router();

wholesaleRouter.use(requireAuth);

wholesaleRouter.get('/mine', asyncHandler(getMyApplication));
wholesaleRouter.post(
  '/',
  uploadWholesaleDocs.fields([
    { name: 'validIdImage', maxCount: 1 },
    { name: 'businessPermitImage', maxCount: 1 },
    { name: 'proofOfBusinessImage', maxCount: 1 },
  ]),
  verifyImageMagicBytes,
  submitApplication
);
