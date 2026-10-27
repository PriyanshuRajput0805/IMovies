import { Router } from 'express';
import {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow
} from '../controllers/show.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';
import { validateCreateShow } from '../validators/cinema.validator.js';

const router = Router();

// Public schedule endpoints
router.get('/', getShows);
router.get('/:id', getShowById);

// Protected Administrator endpoints (with schedule conflict validation)
router.post('/', verifyJWT, requireRole('admin'), validateCreateShow, createShow);
router.patch('/:id', verifyJWT, requireRole('admin'), updateShow);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteShow);

export default router;
