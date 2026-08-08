import { Router } from 'express';
import { register, verifyRegistrationOtp, resendRegistrationOtp, login, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/register/verify-otp', asyncHandler(verifyRegistrationOtp));
authRouter.post('/register/resend-otp', asyncHandler(resendRegistrationOtp));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, asyncHandler(me));
