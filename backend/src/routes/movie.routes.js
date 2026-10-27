import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres
} from '../controllers/movie.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';
import { validateCreateMovie } from '../validators/cinema.validator.js';

const router = Router();

// Public discovery endpoints
router.get('/', getMovies);
router.get('/genres', getGenres);
router.get('/:id', getMovieById);

// Protected Administrator CRUD endpoints
router.post('/', verifyJWT, requireRole('admin'), validateCreateMovie, createMovie);
router.patch('/:id', verifyJWT, requireRole('admin'), updateMovie);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteMovie);

export default router;
