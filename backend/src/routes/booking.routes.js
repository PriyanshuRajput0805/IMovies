import { Router } from 'express';
import {
  lockSelectedSeats,
  unlockSelectedSeats,
  getMyBookings,
  getBookingById,
  cancelBooking
} from '../controllers/booking.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { bookingLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Seat reservation and lock management
router.post('/lock-seats', verifyJWT, bookingLimiter, lockSelectedSeats);
router.post('/unlock-seats', verifyJWT, unlockSelectedSeats);

// Customer booking history and details
router.get('/my-bookings', verifyJWT, getMyBookings);
router.get('/:id', verifyJWT, getBookingById);
router.post('/:id/cancel', verifyJWT, cancelBooking);

export default router;
