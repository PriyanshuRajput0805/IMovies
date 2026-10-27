import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Show } from '../models/show.model.js';
import { SeatLock } from '../models/seatLock.model.js';
import { Booking } from '../models/booking.model.js';

describe('Payments & Checkout API (Phase 6)', () => {
  let customerToken = '';
  let otherCustomerToken = '';
  let testShow = null;
  let createdBookingId = null;

  beforeAll(async () => {
    await connectDB();

    // Authenticate primary Customer
    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@imovies.com', password: 'Customer@123456' });
    customerToken = res1.body.data.accessToken;

    // Authenticate second Customer
    const res2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user2@imovies.com', password: 'User2@123456' });
    otherCustomerToken = res2.body.data.accessToken;

    // Find active show
    testShow = await Show.findOne({ status: 'scheduled' });

    // Clean up locks and previous bookings for clean test run
    if (testShow) {
      await SeatLock.deleteMany({ showId: testShow._id });
      await Booking.deleteMany({ showId: testShow._id });
    }
  }, 60000);

  afterAll(async () => {
    if (testShow) {
      await SeatLock.deleteMany({ showId: testShow._id });
      await Booking.deleteMany({ showId: testShow._id });
    }
    await disconnectDB();
  }, 10000);

  describe('POST /api/v1/payments/create-order', () => {
    it('should reject unauthenticated payment order request with 401', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .send({
          showId: testShow._id,
          seats: ['C1', 'C2']
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should create payment order for selected seats', async () => {
      // First lock the seats
      await request(app)
        .post('/api/v1/bookings/lock-seats')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showId: testShow._id,
          seats: ['C1', 'C2']
        });

      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showId: testShow._id,
          seats: ['C1', 'C2']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('orderId');
      expect(res.body.data).toHaveProperty('amount');
      expect(res.body.data).toHaveProperty('pricing');
      expect(res.body.data.pricing).toHaveProperty('subtotal');
      expect(res.body.data.pricing).toHaveProperty('totalAmount');
      expect(res.body.data.seats.length).toBe(2);
    });

    it('should reject order creation if seats are locked by another user', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          showId: testShow._id,
          seats: ['C1']
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/payments/verify', () => {
    it('should verify payment and atomically confirm booking', async () => {
      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showId: testShow._id,
          seats: ['C1', 'C2'],
          razorpayOrderId: 'order_mock_test_123',
          razorpayPaymentId: 'pay_mock_test_456',
          razorpaySignature: 'mock_signature',
          isMock: true,
          paymentMethod: 'card'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('bookingReference');
      expect(res.body.data.bookingReference).toMatch(/^IMOV-/);
      expect(res.body.data.bookingStatus).toBe('confirmed');
      expect(res.body.data.paymentStatus).toBe('paid');
      expect(res.body.data.ticketCount).toBe(2);
      expect(res.body.data.selectedSeats.length).toBe(2);

      createdBookingId = res.body.data._id;

      // Verify that seat locks are removed from the database
      const remainingLocks = await SeatLock.find({
        showId: testShow._id,
        seatIdentifier: { $in: ['C1', 'C2'] }
      });
      expect(remainingLocks.length).toBe(0);
    });

    it('should prevent double booking if someone tries confirming already booked seats', async () => {
      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          showId: testShow._id,
          seats: ['C1'],
          isMock: true
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Double booking prevented/i);
    });
  });

  describe('POST /api/v1/payments/mock-checkout', () => {
    it('should execute 1-click instant mock checkout cleanly', async () => {
      const res = await request(app)
        .post('/api/v1/payments/mock-checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showId: testShow._id,
          seats: ['D1', 'D2'],
          paymentMethod: 'upi'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingStatus).toBe('confirmed');
      expect(res.body.data.paymentDetails.paymentMethod).toBe('upi');
      expect(res.body.data.selectedSeats.map((s) => s.seatIdentifier)).toEqual(['D1', 'D2']);
    });
  });

  describe('Booking Lifecycle & Details Verification', () => {
    it('GET /api/v1/bookings/my-bookings should list the confirmed bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0]).toHaveProperty('bookingReference');
      expect(res.body.data[0]).toHaveProperty('showId');
    });

    it('GET /api/v1/bookings/:id should return details for booking owner', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdBookingId);
    });

    it('POST /api/v1/bookings/:id/cancel should cancel the booking successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingStatus).toBe('cancelled');
    });
  });
});
