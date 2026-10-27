import { Show } from '../models/show.model.js';
import { Movie } from '../models/movie.model.js';
import { Screen } from '../models/screen.model.js';
import { Theatre } from '../models/theatre.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import {
  calculateEndTime,
  checkScheduleConflict
} from '../services/scheduleConflict.service.js';

/**
 * @desc    Get shows with filtering by movie, theatre, city, date, and format
 * @route   GET /api/v1/shows
 * @access  Public
 */
export const getShows = async (req, res, next) => {
  try {
    const { movieId, theatreId, screenId, city, date, format, status = 'scheduled' } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (movieId) {
      query.movieId = movieId;
    }

    if (theatreId) {
      query.theatreId = theatreId;
    }

    if (screenId) {
      query.screenId = screenId;
    }

    if (format) {
      query.format = format;
    }

    // Date filtering: filter shows for that specific day
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      query.showDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // City filtering: if city is provided, find theatres in that city
    if (city && city !== 'All') {
      const theatresInCity = await Theatre.find({
        city: new RegExp(`^${city.trim()}$`, 'i'),
        status: { $ne: 'inactive' }
      }).select('_id');
      const cityTheatreIds = theatresInCity.map((t) => t._id);
      query.theatreId = { $in: cityTheatreIds };
    }

    const shows = await Show.find(query)
      .populate('movieId', 'title poster duration genres certification rating')
      .populate('theatreId', 'name address city amenities')
      .populate('screenId', 'name screenType supportedFormats totalCapacity')
      .sort({ showDate: 1, startTime: 1 });

    return res.status(200).json(ApiResponse.success(shows, 'Shows retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single show details including full screen seating layout
 * @route   GET /api/v1/shows/:id
 * @access  Public
 */
export const getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movieId')
      .populate('theatreId')
      .populate('screenId');

    if (!show) {
      return next(ApiError.notFound('Show not found'));
    }

    return res.status(200).json(ApiResponse.success(show, 'Show details retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Schedule a new show with conflict prevention
 * @route   POST /api/v1/shows
 * @access  Private (Admin only)
 */
export const createShow = async (req, res, next) => {
  try {
    const {
      movieId,
      theatreId,
      screenId,
      showDate,
      startTime,
      format,
      language,
      pricing
    } = req.body;

    // Verify references
    const [movie, theatre, screen] = await Promise.all([
      Movie.findById(movieId),
      Theatre.findById(theatreId),
      Screen.findById(screenId)
    ]);

    if (!movie) return next(ApiError.notFound('Referenced Movie does not exist.'));
    if (!theatre) return next(ApiError.notFound('Referenced Theatre does not exist.'));
    if (!screen) return next(ApiError.notFound('Referenced Screen does not exist.'));

    // Compute end time based on movie duration + 20-minute turnaround buffer
    const duration = movie.duration || 120;
    const computedEndTime = req.body.endTime || calculateEndTime(startTime, duration, 20);

    // Schedule conflict verification
    const conflictResult = await checkScheduleConflict({
      screenId,
      showDate,
      startTime,
      endTime: computedEndTime
    });

    if (conflictResult.hasConflict) {
      return next(ApiError.conflict(conflictResult.message));
    }

    // Create the show
    const show = await Show.create({
      movieId,
      theatreId,
      screenId,
      showDate: new Date(showDate),
      startTime,
      endTime: computedEndTime,
      format: format || movie.formats?.[0] || '2D',
      language: language || movie.languages?.[0] || 'English',
      pricing: pricing || { standard: 200, premium: 320, vip: 500 }
    });

    const populatedShow = await Show.findById(show._id)
      .populate('movieId', 'title duration poster')
      .populate('theatreId', 'name city')
      .populate('screenId', 'name screenType');

    logger.info(`New show scheduled for '${movie.title}' at ${theatre.name} (${startTime} - ${computedEndTime})`);

    return res.status(201).json(
      ApiResponse.created(populatedShow, 'Show scheduled successfully with zero schedule conflicts')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update show details with schedule conflict revalidation
 * @route   PATCH /api/v1/shows/:id
 * @access  Private (Admin only)
 */
export const updateShow = async (req, res, next) => {
  try {
    const existingShow = await Show.findById(req.params.id);
    if (!existingShow) {
      return next(ApiError.notFound('Show not found'));
    }

    const screenId = req.body.screenId || existingShow.screenId;
    const showDate = req.body.showDate || existingShow.showDate;
    const startTime = req.body.startTime || existingShow.startTime;
    const endTime = req.body.endTime || existingShow.endTime;

    // Check conflict excluding this show
    const conflictResult = await checkScheduleConflict({
      screenId,
      showDate,
      startTime,
      endTime,
      excludeShowId: existingShow._id
    });

    if (conflictResult.hasConflict) {
      return next(ApiError.conflict(conflictResult.message));
    }

    const updatedShow = await Show.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('movieId', 'title poster')
      .populate('theatreId', 'name city')
      .populate('screenId', 'name');

    logger.info(`Show updated: ${updatedShow._id}`);
    return res.status(200).json(ApiResponse.success(updatedShow, 'Show updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a show
 * @route   DELETE /api/v1/shows/:id
 * @access  Private (Admin only)
 */
export const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!show) {
      return next(ApiError.notFound('Show not found'));
    }
    logger.info(`Show cancelled: ${show._id}`);
    return res.status(200).json(ApiResponse.success(show, 'Show cancelled successfully'));
  } catch (error) {
    next(error);
  }
};
