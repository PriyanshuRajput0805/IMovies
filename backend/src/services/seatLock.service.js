import { SeatLock } from '../models/seatLock.model.js';
import { Booking } from '../models/booking.model.js';
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

  // 1. Check if any seat is already booked
  const confirmedBookings = await Booking.find({
    showId,
    bookingStatus: 'confirmed',
    'selectedSeats.seatIdentifier': { $in: seatIdentifiers }
  });

  if (confirmedBookings.length > 0) {
    throw ApiError.conflict('One or more selected seats have already been booked by another customer.');
  }

  // 2. Check if any seat is currently locked by another user
  const activeLocks = await SeatLock.find({
    showId,
    seatIdentifier: { $in: seatIdentifiers },
    expiresAt: { $gt: now }
  });

  const lockedByOther = activeLocks.filter((l) => l.lockedBy.toString() !== userId.toString());
  if (lockedByOther.length > 0) {
    const conflictingSeats = lockedByOther.map((l) => l.seatIdentifier).join(', ');
    throw ApiError.conflict(`Seat(s) ${conflictingSeats} are temporarily reserved by another customer.`);
  }

  // 3. Atomically upsert locks for the requesting user
  const createdLocks = [];
  for (const seatId of seatIdentifiers) {
    const lock = await SeatLock.findOneAndUpdate(
      { showId, seatIdentifier: seatId },
      {
        showId,
        seatIdentifier: seatId,
        lockedBy: userId,
        lockedAt: now,
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdLocks.push(lock);
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
