import { Router } from 'express';
import {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getCities
} from '../controllers/theatre.controller.js';
import {
  getScreensByTheatre,
  createScreen
} from '../controllers/screen.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateCreateTheatre,
  validateCreateScreen
} from '../validators/cinema.validator.js';

const router = Router();

// Public endpoints
router.get('/', getTheatres);
router.get('/cities', getCities);
router.get('/:id', getTheatreById);
router.get('/:theatreId/screens', getScreensByTheatre);

// Protected Administrator CRUD endpoints
router.post('/', verifyJWT, requireRole('admin'), validateCreateTheatre, createTheatre);
router.patch('/:id', verifyJWT, requireRole('admin'), updateTheatre);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteTheatre);
router.post('/:theatreId/screens', verifyJWT, requireRole('admin'), validateCreateScreen, createScreen);

export default router;
