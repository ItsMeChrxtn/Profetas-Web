import { Router } from 'express';
import { createFarmVisit, getMyFarmVisits, getOccupiedDates } from '../controllers/farmVisits.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const farmVisitsRouter = Router();

// Booking a visit needs an account.
farmVisitsRouter.post('/', requireAuth, asyncHandler(createFarmVisit));
farmVisitsRouter.get('/mine', requireAuth, asyncHandler(getMyFarmVisits));
farmVisitsRouter.get('/occupied', asyncHandler(getOccupiedDates));
