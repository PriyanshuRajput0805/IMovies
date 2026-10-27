import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  updateProfile,
  changePassword,
  adminCheck
} from '../controllers/auth.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} from '../validators/auth.validator.js';

const router = Router();

// Public Authentication endpoints with rate limiting & input validation
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', refreshToken);

// Protected Customer endpoints
router.post('/logout', verifyJWT, logout);
router.get('/me', verifyJWT, getMe);
router.patch('/profile', verifyJWT, validateUpdateProfile, updateProfile);
router.post('/change-password', verifyJWT, validateChangePassword, changePassword);

// Protected Administrator endpoint (RBAC check)
router.get('/admin-check', verifyJWT, requireRole('admin'), adminCheck);

export default router;
