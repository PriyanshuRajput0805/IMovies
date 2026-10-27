import { Router } from 'express';
import {
  getScreenById,
  updateScreen,
  deleteScreen
} from '../controllers/screen.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public layout inspection
router.get('/:id', getScreenById);

// Protected Administrator endpoints
router.patch('/:id', verifyJWT, requireRole('admin'), updateScreen);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteScreen);

export default router;
