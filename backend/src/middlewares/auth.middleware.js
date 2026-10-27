import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/**
 * Middleware: Verify JWT Access Token and attach authenticated user to req.user
 */
export const verifyJWT = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication required. No token provided.'));
    }

    // Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session expired. Please log in again.'));
      }
      return next(ApiError.unauthorized('Invalid security token.'));
    }

    // Fetch user from database
    const user = await User.findById(decoded._id);
    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return next(ApiError.forbidden(`Account is ${user.accountStatus}. Please contact cinema support.`));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles - list of roles permitted (e.g. 'admin')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Middleware: Optional JWT
 * Attaches user to req.user if valid token is provided, otherwise proceeds without error
 */
export const optionalJWT = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id);
      if (user && user.accountStatus === 'active') {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};
