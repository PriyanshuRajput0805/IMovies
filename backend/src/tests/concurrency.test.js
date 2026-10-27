import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Show } from '../models/show.model.js';
import { SeatLock } from '../models/seatLock.model.js';
import { BookedSeat } from '../models/bookedSeat.model.js';
import { Booking } from '../models/booking.model.js';
import { User } from '../models/user.model.js';

describe('High-Concurrency Race Condition & Zero Double-Booking Test (Phase 8)', () => {
  let userTokens = [];
  let testShow = null;
  const targetSeat = 'E5';

  beforeAll(async () => {
    await connectDB();
    await SeatLock.createIndexes();
    await BookedSeat.createIndexes();

    // Authenticate / create 5 distinct concurrent users
    for (let i = 1; i <= 5; i++) {
      const email = `concurrent_tester_${i}@imovies.com`;
      let user = await User.findOne({ email });
      if (!user) {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Concurrent Tester ${i}`,
            email,
            password: 'Password@123456',
            phone: `+91998877660${i}`
          });
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'Password@123456' });

      userTokens.push(res.body.data.accessToken);
    }

    testShow = await Show.findOne({ status: 'scheduled' });
    if (testShow) {
      await SeatLock.deleteMany({ showId: testShow._id });
      await BookedSeat.deleteMany({ showId: testShow._id, seatIdentifier: targetSeat });
      await Booking.deleteMany({ showId: testShow._id, 'selectedSeats.seatIdentifier': targetSeat });
    }
  }, 60000);

  afterAll(async () => {
    if (testShow) {
      await SeatLock.deleteMany({ showId: testShow._id });
      await BookedSeat.deleteMany({ showId: testShow._id, seatIdentifier: targetSeat });
      await Booking.deleteMany({ showId: testShow._id, 'selectedSeats.seatIdentifier': targetSeat });
    }
    await disconnectDB();
  }, 10000);

  it('should allow EXACTLY 1 user to lock a contested seat under simultaneous parallel requests', async () => {
    // 5 users simultaneously attempt to lock the exact same seat 'E5'
    const lockRequests = userTokens.map((token) =>
      request(app)
        .post('/api/v1/bookings/lock-seats')
        .set('Authorization', `Bearer ${token}`)
        .send({
          showId: testShow._id,
          seats: [targetSeat]
        })
    );

    const responses = await Promise.all(lockRequests);

    const successfulLocks = responses.filter((r) => r.statusCode === 200);
    const conflictingLocks = responses.filter((r) => r.statusCode === 409);

    // Assert that EXACTLY one lock succeeded
    expect(successfulLocks.length).toBe(1);
    expect(successfulLocks[0].body.success).toBe(true);
    expect(successfulLocks[0].body.data.lockedSeats).toContain(targetSeat);

    // Assert that all other 4 users were blocked with 409 Conflict
    expect(conflictingLocks.length).toBe(4);
    conflictingLocks.forEach((res) => {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/temporarily reserved/i);
    });

    // Verify DB state has exactly one lock record for E5
    const dbLocks = await SeatLock.find({
      showId: testShow._id,
      seatIdentifier: targetSeat
    });
    expect(dbLocks.length).toBe(1);
  });

  it('should guarantee ZERO double-booking when multiple users simultaneously attempt to confirm payment for the same seat', async () => {
    // Release locks first
    await SeatLock.deleteMany({ showId: testShow._id, seatIdentifier: targetSeat });

    // 5 users simultaneously execute mock checkout for 'E5'
    const checkoutRequests = userTokens.map((token) =>
      request(app)
        .post('/api/v1/payments/mock-checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          showId: testShow._id,
          seats: [targetSeat],
          paymentMethod: 'upi'
        })
    );

    const responses = await Promise.all(checkoutRequests);

    const successfulBookings = responses.filter((r) => r.statusCode === 201);
    const conflictingBookings = responses.filter((r) => r.statusCode === 409);

    // EXACTLY 1 booking succeeded
    expect(successfulBookings.length).toBe(1);
    expect(successfulBookings[0].body.data.bookingReference).toMatch(/^IMOV-/);

    // All other 4 users failed with 409 Conflict
    expect(conflictingBookings.length).toBe(4);

    // Verify DB has only 1 confirmed booking for E5
    const confirmedCount = await Booking.countDocuments({
      showId: testShow._id,
      bookingStatus: 'confirmed',
      'selectedSeats.seatIdentifier': targetSeat
    });
    expect(confirmedCount).toBe(1);
  });
});
