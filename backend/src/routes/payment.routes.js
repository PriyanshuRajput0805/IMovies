import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  mockInstantCheckout
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { bookingLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Create Razorpay or Mock Order
router.post('/create-order', verifyJWT, bookingLimiter, createOrder);

// Verify Signature and Confirm Booking
router.post('/verify', verifyJWT, bookingLimiter, verifyPayment);

// Rapid 1-Click Mock Checkout
router.post('/mock-checkout', verifyJWT, bookingLimiter, mockInstantCheckout);

export default router;
