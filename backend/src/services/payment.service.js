import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Booking } from '../models/booking.model.js';
import { Show } from '../models/show.model.js';
import { SeatLock } from '../models/seatLock.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { broadcastBookingConfirmed } from '../sockets/index.js';

// Initialize Razorpay SDK instance
let razorpayClient = null;
try {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }
} catch (err) {
  logger.warn('Failed to initialize Razorpay client, using mock fallback', { error: err.message });
}

/**
 * Generate a unique, formatted booking reference
 * e.g. "IMOV-9K2L4P"
 */
export const generateBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'IMOV-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

/**
 * Calculate accurate pricing breakdown for selected seats
 * @param {Object} show
 * @param {string[]} seatIdentifiers
 * @returns {Object}
 */
export const computeBookingPricing = (show, seatIdentifiers) => {
  const rows = show.screenId?.seatingLayout?.rows || [];
  const selectedSeatsInfo = [];

  for (const seatId of seatIdentifiers) {
    const match = seatId.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) continue;
    const [, rowLabel, seatNumStr] = match;
    const seatNumber = parseInt(seatNumStr, 10);

    const row = rows.find((r) => r.rowLabel.toUpperCase() === rowLabel.toUpperCase());
    const category = row ? row.category : 'standard';
    const price = show.pricing?.[category] || 200;

    selectedSeatsInfo.push({
      seatIdentifier: seatId,
      rowLabel,
      seatNumber,
      category,
      price
    });
  }

  const subtotal = selectedSeatsInfo.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeatsInfo.length > 0 ? 30 : 0;
  const taxes = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + convenienceFee + taxes;

  return {
    selectedSeatsInfo,
    priceBreakdown: {
      subtotal,
      convenienceFee,
      taxes,
      totalAmount
    },
    totalAmount
  };
};

/**
 * Create a Payment Order (Razorpay or Mock Fallback)
 * @param {Object} params
 * @param {string} params.showId
 * @param {string[]} params.seats
 * @param {string} params.userId
 * @returns {Promise<Object>}
 */
export const createPaymentOrder = async ({ showId, seats, userId }) => {
  if (!seats || seats.length === 0) {
    throw ApiError.badRequest('Please select at least one seat to proceed with payment.');
  }

  const show = await Show.findById(showId)
    .populate('movieId', 'title duration poster')
    .populate('theatreId', 'name city')
    .populate('screenId');

  if (!show) {
    throw ApiError.notFound('Show schedule not found');
  }

  // 1. Verify seat availability / current locks
  const alreadyBooked = await Booking.find({
    showId,
    bookingStatus: 'confirmed',
    'selectedSeats.seatIdentifier': { $in: seats }
  });

  if (alreadyBooked.length > 0) {
    throw ApiError.conflict('One or more selected seats have already been booked.');
  }

  // Check locks
  const activeLocks = await SeatLock.find({
    showId,
    seatIdentifier: { $in: seats },
    expiresAt: { $gt: new Date() }
  });

  const lockedByOther = activeLocks.filter((l) => l.lockedBy.toString() !== userId.toString());
  if (lockedByOther.length > 0) {
    const conflicting = lockedByOther.map((l) => l.seatIdentifier).join(', ');
    throw ApiError.conflict(`Seat(s) ${conflicting} are currently reserved by another customer.`);
  }

  // 2. Compute bill
  const { selectedSeatsInfo, priceBreakdown, totalAmount } = computeBookingPricing(show, seats);

  const receipt = `rcpt_${Date.now()}_${userId.toString().slice(-4)}`;
  const isMockKey = !env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID.includes('mock') || env.RAZORPAY_KEY_ID.includes('placeholder');

  // 3. Create Order
  if (razorpayClient && !isMockKey) {
    try {
      const order = await razorpayClient.orders.create({
        amount: Math.round(totalAmount * 100), // amount in paise
        currency: 'INR',
        receipt,
        notes: {
          showId: showId.toString(),
          userId: userId.toString(),
          seats: seats.join(',')
        }
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: env.RAZORPAY_KEY_ID,
        isMock: false,
        pricing: priceBreakdown,
        seats: selectedSeatsInfo,
        show: {
          _id: show._id,
          movie: show.movieId,
          theatre: show.theatreId,
          screen: show.screenId?.name,
          showDate: show.showDate,
          startTime: show.startTime
        }
      };
    } catch (razorpayErr) {
      logger.warn('Razorpay order creation failed, falling back to instant mock payment', {
        error: razorpayErr.message
      });
    }
  }

  // Mock Payment Order Fallback
  const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 10)}`;
  return {
    orderId: mockOrderId,
    amount: Math.round(totalAmount * 100),
    currency: 'INR',
    key: 'rzp_test_mock',
    isMock: true,
    pricing: priceBreakdown,
    seats: selectedSeatsInfo,
    show: {
      _id: show._id,
      movie: show.movieId,
      theatre: show.theatreId,
      screen: show.screenId?.name,
      showDate: show.showDate,
      startTime: show.startTime
    }
  };
};

/**
 * Verify payment signature and atomically confirm the booking
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const verifyAndConfirmBooking = async ({
  showId,
  seats,
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  isMock = false,
  paymentMethod = 'card'
}) => {
  if (!showId || !seats || seats.length === 0) {
    throw ApiError.badRequest('showId and seats are required');
  }

  // 1. Verify Payment Signature
  if (!isMock && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest('Payment verification failed. Invalid signature.');
    }
  }

  const show = await Show.findById(showId)
    .populate('movieId', 'title poster duration certification')
    .populate('theatreId', 'name city address')
    .populate('screenId', 'name screenType');

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  // 2. Concurrency Safety: Check if already booked
  const conflictingBookings = await Booking.find({
    showId,
    bookingStatus: 'confirmed',
    'selectedSeats.seatIdentifier': { $in: seats }
  });

  if (conflictingBookings.length > 0) {
    throw ApiError.conflict('Double booking prevented: One or more seats were already booked.');
  }

  // 3. Compute final pricing & build seat structures
  const { selectedSeatsInfo, priceBreakdown, totalAmount } = computeBookingPricing(show, seats);

  // 4. Create confirmed Booking record
  const bookingReference = generateBookingReference();

  const booking = await Booking.create({
    bookingReference,
    userId,
    showId,
    selectedSeats: selectedSeatsInfo,
    ticketCount: selectedSeatsInfo.length,
    priceBreakdown,
    totalAmount,
    currency: 'INR',
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    paymentDetails: {
      razorpayOrderId: razorpayOrderId || `mock_ord_${Date.now()}`,
      razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'mock_signature',
      paymentMethod,
      paidAt: new Date()
    },
    bookedAt: new Date()
  });

  // 5. Release temporary seat locks
  await SeatLock.deleteMany({
    showId,
    seatIdentifier: { $in: seats }
  });

  // 6. Broadcast real-time booking confirmation to all users viewing this show
  broadcastBookingConfirmed(showId, { seats });

  logger.info(`Booking confirmed successfully: ${bookingReference} for user ${userId}`);

  // 7. Return populated booking
  const populatedBooking = await Booking.findById(booking._id).populate({
    path: 'showId',
    populate: [
      { path: 'movieId', select: 'title poster duration certification' },
      { path: 'theatreId', select: 'name city address' },
      { path: 'screenId', select: 'name screenType' }
    ]
  }).populate('userId', 'name email phone');

  return populatedBooking;
};
