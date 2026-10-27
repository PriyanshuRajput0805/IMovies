import { Booking } from '../models/booking.model.js';
import { Show } from '../models/show.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import {
  getShowSeatLayoutWithAvailability,
  lockSeats,
  releaseSeats
} from '../services/seatLock.service.js';

/**
 * @desc    Get full interactive seating layout and real-time seat states for a show
 * @route   GET /api/v1/shows/:id/seats
 * @access  Public (Optionally authenticated to identify locked_by_me)
 */
export const getShowSeats = async (req, res, next) => {
  try {
    const layout = await getShowSeatLayoutWithAvailability(
      req.params.id,
      req.user?._id
    );
    return res.status(200).json(ApiResponse.success(layout, 'Seat availability retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Temporarily reserve / lock selected seats before payment
 * @route   POST /api/v1/bookings/lock-seats
 * @access  Private
 */
export const lockSelectedSeats = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    if (!showId || !seats) {
      return next(ApiError.badRequest('showId and seats array are required'));
    }

    const result = await lockSeats({
      showId,
      seatIdentifiers: seats,
      userId: req.user._id
    });

    logger.info(`Seats locked by user ${req.user.email}: ${seats.join(', ')} for show ${showId}`);

    return res.status(200).json(ApiResponse.success(result, 'Seats reserved for 10 minutes'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release / unlock temporarily reserved seats
 * @route   POST /api/v1/bookings/unlock-seats
 * @access  Private
 */
export const unlockSelectedSeats = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    if (!showId) {
      return next(ApiError.badRequest('showId is required'));
    }

    const result = await releaseSeats({
      showId,
      seatIdentifiers: seats,
      userId: req.user._id
    });

    logger.info(`Seats unlocked by user ${req.user.email} for show ${showId}`);

    return res.status(200).json(ApiResponse.success(result, 'Seats released'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's booking history
 * @route   GET /api/v1/bookings/my-bookings
 * @access  Private
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate({
        path: 'showId',
        populate: [
          { path: 'movieId', select: 'title poster duration certification' },
          { path: 'theatreId', select: 'name city address' },
          { path: 'screenId', select: 'name screenType' }
        ]
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(
      ApiResponse.success(bookings, 'User bookings retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking details by ID
 * @route   GET /api/v1/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'showId',
      populate: [
        { path: 'movieId' },
        { path: 'theatreId' },
        { path: 'screenId' }
      ]
    });

    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    // Ownership check: only booking owner or admin can view
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(ApiError.forbidden('You do not have permission to view this booking'));
    }

    return res.status(200).json(ApiResponse.success(booking, 'Booking details retrieved'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an eligible booking
 * @route   POST /api/v1/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('showId');

    if (!booking) {
      return next(ApiError.notFound('Booking not found'));
    }

    // Ownership check
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(ApiError.forbidden('You do not have permission to cancel this booking'));
    }

    if (booking.bookingStatus === 'cancelled') {
      return next(ApiError.badRequest('Booking has already been cancelled'));
    }

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    logger.info(`Booking cancelled: ${booking.bookingReference}`);

    return res.status(200).json(ApiResponse.success(booking, 'Booking cancelled successfully'));
  } catch (error) {
    next(error);
  }
};
