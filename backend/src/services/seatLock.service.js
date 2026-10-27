import { SeatLock } from '../models/seatLock.model.js';
import { Booking } from '../models/booking.model.js';
import { BookedSeat } from '../models/bookedSeat.model.js';
import { Show } from '../models/show.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import {
  broadcastSeatLock,
  broadcastSeatUnlock
} from '../sockets/index.js';

/**
 * Get full authoritative seating layout for a show with real-time status of every seat
 * @param {string} showId
 * @param {string} [currentUserId]
 * @returns {Promise<Object>}
 */
export const getShowSeatLayoutWithAvailability = async (showId, currentUserId = null) => {
  const show = await Show.findById(showId)
    .populate('movieId', 'title duration poster certification')
    .populate('theatreId', 'name city address')
    .populate('screenId');

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  const now = new Date();

  // 1. Fetch confirmed / paid bookings for this show
  const confirmedBookings = await Booking.find({
    showId,
    bookingStatus: 'confirmed'
  }).select('selectedSeats');

  const permanentlyBookedSeats = new Set();
  confirmedBookings.forEach((b) => {
    b.selectedSeats.forEach((seat) => {
      permanentlyBookedSeats.add(seat.seatIdentifier);
    });
  });

  const bookedSeatDocs = await BookedSeat.find({ showId }).select('seatIdentifier');
  bookedSeatDocs.forEach((bs) => permanentlyBookedSeats.add(bs.seatIdentifier));

  // 2. Fetch active, unexpired seat locks
  const activeLocks = await SeatLock.find({
    showId,
    expiresAt: { $gt: now }
  });

  const lockedSeatsMap = {};
  activeLocks.forEach((lock) => {
    const isLockedByMe = currentUserId && lock.lockedBy.toString() === currentUserId.toString();
    lockedSeatsMap[lock.seatIdentifier] = {
      lockedByMe: Boolean(isLockedByMe),
      lockedUntil: lock.expiresAt
    };
  });

  // 3. Build seat matrix with exact real-time statuses
  const rowsLayout = show.screenId?.seatingLayout?.rows || [];
  const matrix = rowsLayout.map((row) => {
    const seats = [];
    for (let seatNum = 1; seatNum <= row.seatsCount; seatNum++) {
      const seatId = `${row.rowLabel}${seatNum}`;
      const isAccessible = row.accessibleSeats?.includes(seatNum);

      let status = 'available';
      let lockedUntil = null;

      if (permanentlyBookedSeats.has(seatId)) {
        status = 'booked';
      } else if (lockedSeatsMap[seatId]) {
        if (lockedSeatsMap[seatId].lockedByMe) {
          status = 'locked_by_me';
          lockedUntil = lockedSeatsMap[seatId].lockedUntil;
        } else {
          status = 'locked';
          lockedUntil = lockedSeatsMap[seatId].lockedUntil;
        }
      }

      // Tier price
      const price = show.pricing?.[row.category] || 200;

      seats.push({
        seatIdentifier: seatId,
        rowLabel: row.rowLabel,
        seatNumber: seatNum,
        category: row.category,
        price,
        isAccessible: Boolean(isAccessible),
        status,
        lockedUntil
      });
    }

    return {
      rowLabel: row.rowLabel,
      category: row.category,
      seatsCount: row.seatsCount,
      seats
    };
  });

  return {
    show: {
      _id: show._id,
      showDate: show.showDate,
      startTime: show.startTime,
      endTime: show.endTime,
      format: show.format,
      pricing: show.pricing,
      movie: show.movieId,
      theatre: show.theatreId,
      screen: {
        _id: show.screenId?._id,
        name: show.screenId?.name,
        screenType: show.screenId?.screenType,
        totalCapacity: show.screenId?.totalCapacity
      }
    },
    seatingMatrix: matrix,
    lockExpiryMinutes: env.SEAT_LOCK_EXPIRY_MINUTES,
    totalBookedSeats: permanentlyBookedSeats.size,
    totalLockedSeats: Object.keys(lockedSeatsMap).length
  };
};

/**
 * Temporarily lock seats for a user during booking checkout
 * @param {Object} params
 * @param {string} params.showId
 * @param {string[]} params.seatIdentifiers - e.g. ["A1", "A2"]
 * @param {string} params.userId
 * @returns {Promise<Object>}
 */
export const lockSeats = async ({ showId, seatIdentifiers, userId }) => {
  if (!seatIdentifiers || seatIdentifiers.length === 0) {
    throw ApiError.badRequest('Please select at least one seat to reserve.');
  }

  if (seatIdentifiers.length > 8) {
    throw ApiError.badRequest('Maximum 8 tickets allowed per transaction.');
  }

  const show = await Show.findById(showId).populate('screenId');
  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  const now = new Date();
  const lockDurationMs = env.SEAT_LOCK_EXPIRY_MINUTES * 60 * 1000;
  const expiresAt = new Date(now.getTime() + lockDurationMs);

  // 1. Check if any seat is already booked in BookedSeat or Booking
  const alreadyBooked = await BookedSeat.find({
    showId,
    seatIdentifier: { $in: seatIdentifiers }
  });

  if (alreadyBooked.length > 0) {
    throw ApiError.conflict('One or more selected seats have already been booked by another customer.');
  }

  // 2. Clean up expired locks
  await SeatLock.deleteMany({
    showId,
    expiresAt: { $lte: now }
  });

  // 3. Remove any locks previously held by this same user for these seats
  await SeatLock.deleteMany({
    showId,
    lockedBy: userId,
    seatIdentifier: { $in: seatIdentifiers }
  });

  // 4. Atomically insert locks. Compound unique index { showId: 1, seatIdentifier: 1 }
  // guarantees that parallel race conditions fail with 11000 duplicate key error.
  const lockDocs = seatIdentifiers.map((seatId) => ({
    showId,
    seatIdentifier: seatId,
    lockedBy: userId,
    lockedAt: now,
    expiresAt
  }));

  try {
    await SeatLock.insertMany(lockDocs, { ordered: true });
  } catch (err) {
    if (
      err.code === 11000 ||
      (err.writeErrors && err.writeErrors.some((we) => we.code === 11000)) ||
      err.name === 'MongoServerError'
    ) {
      throw ApiError.conflict('One or more selected seats are temporarily reserved by another customer.');
    }
    throw err;
  }

  // 4. Real-time broadcast to all viewers in this show room via Socket.IO
  broadcastSeatLock(showId, {
    seats: seatIdentifiers,
    lockedUntil: expiresAt,
    lockedBy: userId
  });

  return {
    success: true,
    showId,
    lockedSeats: seatIdentifiers,
    expiresAt,
    remainingSeconds: Math.floor(lockDurationMs / 1000)
  };
};

/**
 * Release temporary seat locks held by a user
 * @param {Object} params
 * @param {string} params.showId
 * @param {string[]} params.seatIdentifiers
 * @param {string} params.userId
 * @returns {Promise<Object>}
 */
export const releaseSeats = async ({ showId, seatIdentifiers, userId }) => {
  const query = {
    showId,
    lockedBy: userId
  };

  if (seatIdentifiers && seatIdentifiers.length > 0) {
    query.seatIdentifier = { $in: seatIdentifiers };
  }

  const deleted = await SeatLock.deleteMany(query);

  // Broadcast unlock event to all viewers in this show room
  if (seatIdentifiers && seatIdentifiers.length > 0) {
    broadcastSeatUnlock(showId, { seats: seatIdentifiers });
  }

  return {
    success: true,
    releasedCount: deleted.deletedCount
  };
};
