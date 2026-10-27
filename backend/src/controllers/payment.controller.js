import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createPaymentOrder,
  verifyAndConfirmBooking
} from '../services/payment.service.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Create a payment order for selected show seats
 * @route   POST /api/v1/payments/create-order
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return next(ApiError.badRequest('showId and seats array are required'));
    }

    const orderData = await createPaymentOrder({
      showId,
      seats,
      userId: req.user._id
    });

    return res
      .status(200)
      .json(ApiResponse.success(orderData, 'Payment order created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify payment signature and finalize confirmed booking
 * @route   POST /api/v1/payments/verify
 * @access  Private
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      showId,
      seats,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isMock,
      paymentMethod
    } = req.body;

    if (!showId || !seats) {
      return next(ApiError.badRequest('showId and seats array are required'));
    }

    const confirmedBooking = await verifyAndConfirmBooking({
      showId,
      seats,
      userId: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isMock: Boolean(isMock),
      paymentMethod: paymentMethod || 'card'
    });

    return res
      .status(201)
      .json(ApiResponse.created(confirmedBooking, 'Payment verified and booking confirmed!'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    1-Click Instant Mock Checkout for rapid testing and demonstrations
 * @route   POST /api/v1/payments/mock-checkout
 * @access  Private
 */
export const mockInstantCheckout = async (req, res, next) => {
  try {
    const { showId, seats, paymentMethod = 'upi' } = req.body;
    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return next(ApiError.badRequest('showId and seats array are required'));
    }

    const confirmedBooking = await verifyAndConfirmBooking({
      showId,
      seats,
      userId: req.user._id,
      razorpayOrderId: `mock_ord_${Date.now()}`,
      razorpayPaymentId: `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      razorpaySignature: 'mock_verified_signature',
      isMock: true,
      paymentMethod
    });

    logger.info(`Mock checkout executed successfully: ${confirmedBooking.bookingReference}`);

    return res
      .status(201)
      .json(ApiResponse.created(confirmedBooking, 'Instant mock booking completed successfully!'));
  } catch (error) {
    next(error);
  }
};
