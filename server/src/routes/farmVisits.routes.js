import { Router } from 'express';
import { createFarmVisit } from '../controllers/farmVisits.controller.js';
import { attachUserIfPresent } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const farmVisitsRouter = Router();

// Guests can book a visit too - attachUserIfPresent links it to an account when logged in, without requiring one.
farmVisitsRouter.post('/', attachUserIfPresent, asyncHandler(createFarmVisit));
