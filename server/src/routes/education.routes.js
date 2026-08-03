import { Router } from 'express';
import { listPosts, getPost } from '../controllers/education.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const educationRouter = Router();

educationRouter.get('/', asyncHandler(listPosts));
educationRouter.get('/:id', asyncHandler(getPost));
