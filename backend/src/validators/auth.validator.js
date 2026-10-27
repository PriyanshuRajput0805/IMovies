import { ApiError } from '../utils/ApiError.js';

export const validateRegister = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (phone && (typeof phone !== 'string' || phone.length < 8)) {
    errors.push({ field: 'phone', message: 'Phone number format is invalid' });
  }

  // Security: prevent privilege escalation through request body
  if (req.body.role && req.body.role !== 'user') {
    delete req.body.role;
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email address is required' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

export const validateUpdateProfile = (req, res, next) => {
  const { name, phone } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push({ field: 'phone', message: 'Phone number must be a valid string' });
  }

  // Disallow modifying sensitive fields through this endpoint
  delete req.body.role;
  delete req.body.accountStatus;
  delete req.body.password;
  delete req.body.email;

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push({ field: 'currentPassword', message: 'Current password is required' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push({ field: 'newPassword', message: 'New password must be different from current password' });
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }

  next();
};
