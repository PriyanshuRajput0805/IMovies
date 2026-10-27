import { Theatre } from '../models/theatre.model.js';
import { Screen } from '../models/screen.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Get all theatres with optional city filter & search
 * @route   GET /api/v1/theatres
 * @access  Public
 */
export const getTheatres = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const query = { status: { $ne: 'inactive' } };

    if (city && city !== 'All') {
      query.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { address: searchRegex }, { city: searchRegex }];
    }

    const theatres = await Theatre.find(query).sort({ city: 1, name: 1 });

    // Attach screen counts
    const theatreIds = theatres.map((t) => t._id);
    const screens = await Screen.find({ theatreId: { $in: theatreIds } });
    
    const screenCountMap = {};
    screens.forEach((s) => {
      const key = s.theatreId.toString();
      screenCountMap[key] = (screenCountMap[key] || 0) + 1;
    });

    const theatresWithScreens = theatres.map((t) => ({
      ...t.toObject(),
      screensCount: screenCountMap[t._id.toString()] || 0
    }));

    return res.status(200).json(
      ApiResponse.success(theatresWithScreens, 'Theatres retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single theatre details with all associated screens
 * @route   GET /api/v1/theatres/:id
 * @access  Public
 */
export const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return next(ApiError.notFound('Theatre not found'));
    }

    const screens = await Screen.find({ theatreId: theatre._id, status: 'active' });

    return res.status(200).json(
      ApiResponse.success(
        {
          ...theatre.toObject(),
          screens
        },
        'Theatre details retrieved'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new theatre
 * @route   POST /api/v1/theatres
 * @access  Private (Admin only)
 */
export const createTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.create(req.body);
    logger.info(`New theatre created: ${theatre.name} in ${theatre.city}`);
    return res.status(201).json(ApiResponse.created(theatre, 'Theatre created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update theatre by ID
 * @route   PATCH /api/v1/theatres/:id
 * @access  Private (Admin only)
 */
export const updateTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!theatre) {
      return next(ApiError.notFound('Theatre not found'));
    }
    logger.info(`Theatre updated: ${theatre.name}`);
    return res.status(200).json(ApiResponse.success(theatre, 'Theatre updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete theatre by ID
 * @route   DELETE /api/v1/theatres/:id
 * @access  Private (Admin only)
 */
export const deleteTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!theatre) {
      return next(ApiError.notFound('Theatre not found'));
    }
    logger.info(`Theatre deactivated: ${theatre.name}`);
    return res.status(200).json(ApiResponse.success(theatre, 'Theatre deactivated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all distinct active cities
 * @route   GET /api/v1/theatres/cities
 * @access  Public
 */
export const getCities = async (req, res, next) => {
  try {
    const cities = await Theatre.distinct('city', { status: { $ne: 'inactive' } });
    return res.status(200).json(ApiResponse.success(cities.sort(), 'Distinct cities retrieved'));
  } catch (error) {
    next(error);
  }
};
