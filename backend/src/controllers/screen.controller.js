import { Screen } from '../models/screen.model.js';
import { Theatre } from '../models/theatre.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get all screens for a specific theatre
 * @route   GET /api/v1/theatres/:theatreId/screens
 * @access  Public
 */
export const getScreensByTheatre = async (req, res, next) => {
  try {
    const screens = await Screen.find({ theatreId: req.params.theatreId });
    return res.status(200).json(ApiResponse.success(screens, 'Screens retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single screen details
 * @route   GET /api/v1/screens/:id
 * @access  Public
 */
export const getScreenById = async (req, res, next) => {
  try {
    const screen = await Screen.findById(req.params.id).populate('theatreId', 'name city');
    if (!screen) {
      return next(ApiError.notFound('Screen not found'));
    }
    return res.status(200).json(ApiResponse.success(screen, 'Screen details retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new screen in a theatre
 * @route   POST /api/v1/theatres/:theatreId/screens
 * @access  Private (Admin only)
 */
export const createScreen = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.theatreId);
    if (!theatre) {
      return next(ApiError.notFound('Theatre not found'));
    }

    const screenData = {
      ...req.body,
      theatreId: theatre._id
    };

    const screen = await Screen.create(screenData);
    logger.info(`New screen created: ${screen.name} for theatre ${theatre.name}`);
    return res.status(201).json(ApiResponse.created(screen, 'Screen created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update screen configuration
 * @route   PATCH /api/v1/screens/:id
 * @access  Private (Admin only)
 */
export const updateScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!screen) {
      return next(ApiError.notFound('Screen not found'));
    }
    logger.info(`Screen updated: ${screen.name}`);
    return res.status(200).json(ApiResponse.success(screen, 'Screen updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/deactivate a screen
 * @route   DELETE /api/v1/screens/:id
 * @access  Private (Admin only)
 */
export const deleteScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndUpdate(
      req.params.id,
      { status: 'maintenance' },
      { new: true }
    );
    if (!screen) {
      return next(ApiError.notFound('Screen not found'));
    }
    logger.info(`Screen set to maintenance: ${screen.name}`);
    return res.status(200).json(ApiResponse.success(screen, 'Screen deactivated successfully'));
  } catch (error) {
    next(error);
  }
};
