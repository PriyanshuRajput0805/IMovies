import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Register a new customer account
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email address already exists.'));
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'user', // default role
      accountStatus: 'active'
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`User registered successfully: ${user.email} (${user._id})`);

    return res.status(201).json(
      ApiResponse.created(
        {
          user: user.toJSON(),
          accessToken,
          refreshToken
        },
        'Registration successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get tokens
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user including password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(ApiError.unauthorized('Invalid email or password.'));
    }

    // Verify account status
    if (user.accountStatus !== 'active') {
      return next(ApiError.forbidden(`Your account has been ${user.accountStatus}. Please contact support.`));
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${user.email} [${user.role}]`);

    return res.status(200).json(
      ApiResponse.success(
        {
          user: user.toJSON(),
          accessToken,
          refreshToken
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out user and invalidate refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
      logger.info(`User logged out: ${req.user.email}`);
    }

    return res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json(
      ApiResponse.success(
        { user: req.user.toJSON() },
        'User profile retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rotate and refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);

    if (!token) {
      return next(ApiError.unauthorized('Refresh token is required.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(ApiError.unauthorized('Invalid or expired refresh token. Please sign in again.'));
    }

    const user = await User.findById(decoded._id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return next(ApiError.unauthorized('Refresh token is invalid or has been revoked.'));
    }

    // Generate fresh tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
      ApiResponse.success(
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update permitted profile fields (name, phone)
 * @route   PATCH /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    return res.status(200).json(
      ApiResponse.success(
        { user: user.toJSON() },
        'Profile updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user account password
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(ApiError.badRequest('Current password entered is incorrect.'));
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    return res.status(200).json(
      ApiResponse.success(null, 'Password changed successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Diagnostic endpoint to verify administrator access
 * @route   GET /api/v1/auth/admin-check
 * @access  Private (Admin only)
 */
export const adminCheck = async (req, res) => {
  return res.status(200).json(
    ApiResponse.success(
      { adminAccessGranted: true, user: req.user.toJSON() },
      'Administrator authorization verified'
    )
  );
};
