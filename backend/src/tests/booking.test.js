import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Show } from '../models/show.model.js';
import { SeatLock } from '../models/seatLock.model.js';
import { User } from '../models/user.model.js';

describe('Seat Booking & Real-Time Concurrency API (Phase 5)', () => {
  let customer1Token = '';
  let customer2Token = '';
  let testShow = null;

  beforeAll(async () => {
    await connectDB();

    // Authenticate Customer 1
    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@imovies.com', password: 'Customer@123456' });
    customer1Token = res1.body.data.accessToken;

    // Create / Authenticate Customer 2 for concurrency tests
    let user2 = await User.findOne({ email: 'user2@imovies.com' });
    if (!user2) {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Concurrent User',
          email: 'user2@imovies.com',
          password: 'User2@123456',
          phone: '+919876543219'
        });
    }

    const res2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user2@imovies.com', password: 'User2@123456' });
    customer2Token = res2.body.data.accessToken;

    // Fetch an active show
    testShow = await Show.findOne({ status: 'scheduled' });

    // Clean up any stale locks for this show
    if (testShow) {
      await SeatLock.deleteMany({ showId: testShow._id });
    }
  }, 60000);

  afterAll(async () => {
    if (testShow) {
      await SeatLock.deleteMany({ showId: testShow._id });
    }
    await disconnectDB();
  }, 10000);

  describe('GET /api/v1/shows/:id/seats', () => {
    it('should return seat layout and availability for a valid show (public/anonymous)', async () => {
      const res = await request(app).get(`/api/v1/shows/${testShow._id}/seats`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('show');
      expect(res.body.data).toHaveProperty('seatingMatrix');
      expect(Array.isArray(res.body.data.seatingMatrix)).toBe(true);
      expect(res.body.data.seatingMatrix.length).toBeGreaterThan(0);

      const firstRow = res.body.data.seatingMatrix[0];
      expect(firstRow).toHaveProperty('rowLabel');
      expect(firstRow).toHaveProperty('category');
      expect(firstRow).toHaveProperty('seats');
      expect(firstRow.seats[0]).toHaveProperty('seatIdentifier');
      expect(firstRow.seats[0]).toHaveProperty('status');
      expect(firstRow.seats[0]).toHaveProperty('price');
    });

    it('should return 404 for a non-existent show ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/v1/shows/${fakeId}/seats`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/bookings/lock-seats', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/lock-seats')
        .send({
          showId: testShow._id,
          seats: ['A1', 'A2']
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should lock seats successfully for an authenticated customer', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/lock-seats')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          showId: testShow._id,
          seats: ['A1', 'A2']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedSeats).toEqual(['A1', 'A2']);
      expect(res.body.data).toHaveProperty('expiresAt');
      expect(res.body.data.remainingSeconds).toBeGreaterThan(0);
    });

    it('should reflect locked_by_me for Customer 1 and locked for Customer 2', async () => {
      // Customer 1 views seats
      const res1 = await request(app)
        .get(`/api/v1/shows/${testShow._id}/seats`)
        .set('Authorization', `Bearer ${customer1Token}`);

      const rowA1 = res1.body.data.seatingMatrix.find((r) => r.rowLabel === 'A');
      const seatA1_forUser1 = rowA1.seats.find((s) => s.seatIdentifier === 'A1');
      expect(seatA1_forUser1.status).toBe('locked_by_me');

      // Customer 2 views seats
      const res2 = await request(app)
        .get(`/api/v1/shows/${testShow._id}/seats`)
        .set('Authorization', `Bearer ${customer2Token}`);

      const rowA2 = res2.body.data.seatingMatrix.find((r) => r.rowLabel === 'A');
      const seatA1_forUser2 = rowA2.seats.find((s) => s.seatIdentifier === 'A1');
      expect(seatA1_forUser2.status).toBe('locked');
    });

    it('should prevent double-locking with 409 Conflict when Customer 2 tries locking A1', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/lock-seats')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          showId: testShow._id,
          seats: ['A1', 'A3']
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/temporarily reserved/i);
    });

    it('should reject locking more than 8 seats with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/lock-seats')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          showId: testShow._id,
          seats: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Maximum 8 tickets/i);
    });
  });

  describe('POST /api/v1/bookings/unlock-seats', () => {
    it('should release seats held by customer 1', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/unlock-seats')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          showId: testShow._id,
          seats: ['A1', 'A2']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.releasedCount).toBe(2);
    });

    it('should allow customer 2 to now lock the released seat A1', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/lock-seats')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          showId: testShow._id,
          seats: ['A1']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedSeats).toEqual(['A1']);

      // Cleanup
      await request(app)
        .post('/api/v1/bookings/unlock-seats')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          showId: testShow._id,
          seats: ['A1']
        });
    });
  });

  describe('GET /api/v1/bookings/my-bookings', () => {
    it('should return bookings array for authenticated customer', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
