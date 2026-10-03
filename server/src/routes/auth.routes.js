import { Router } from 'express';
import {
  register,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/register/verify-otp', asyncHandler(verifyRegistrationOtp));
authRouter.post('/register/resend-otp', asyncHandler(resendRegistrationOtp));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/logout', logout);
authRouter.post('/forgot-password', asyncHandler(forgotPassword));
authRouter.post('/reset-password', asyncHandler(resetPassword));
authRouter.get('/me', requireAuth, asyncHandler(me));
authRouter.patch('/profile', requireAuth, asyncHandler(updateProfile));
authRouter.patch('/password', requireAuth, asyncHandler(changePassword));
