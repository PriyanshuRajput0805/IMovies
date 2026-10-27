import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Movie } from '../models/movie.model.js';
import { Theatre } from '../models/theatre.model.js';
import { Screen } from '../models/screen.model.js';
import { Show } from '../models/show.model.js';

describe('Cinema Data Management & Scheduling API (Phase 3)', () => {
  let adminToken = '';
  let customerToken = '';
  let testMovie = null;
  let testTheatre = null;
  let testScreen = null;

  beforeAll(async () => {
    await connectDB();

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@imovies.com', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;

    // Authenticate Customer
    const customerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@imovies.com', password: 'Customer@123456' });
    customerToken = customerRes.body.data.accessToken;

    // Fetch existing seeded movie, theatre, screen for tests
    testMovie = await Movie.findOne({ title: 'Interstellar' });
    testTheatre = await Theatre.findOne({ city: 'Mumbai' });
    testScreen = await Screen.findOne({ theatreId: testTheatre._id });
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
  }, 10000);

  describe('Movies API', () => {
    it('GET /api/v1/movies should return paginated movies with metadata', async () => {
      const res = await request(app).get('/api/v1/movies');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
    });

    it('GET /api/v1/movies/genres should return distinct genres', async () => {
      const res = await request(app).get('/api/v1/movies/genres');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toContain('Sci-Fi');
    });

    it('GET /api/v1/movies/:id should return single movie details', async () => {
      const res = await request(app).get(`/api/v1/movies/${testMovie._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Interstellar');
      expect(res.body.data).toHaveProperty('duration');
      expect(res.body.data).toHaveProperty('formats');
    });

    it('POST /api/v1/movies should block regular customer with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Unauthorized Film',
          description: 'A test film',
          poster: 'https://example.com/poster.jpg',
          genres: ['Drama'],
          duration: 120,
          releaseDate: '2025-01-01'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/movies should allow admin to create a new movie', async () => {
      const title = `Admin Test Film ${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title,
          description: 'Created by admin in automated testing',
          poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
          genres: ['Action', 'Thriller'],
          languages: ['English'],
          duration: 135,
          releaseDate: '2025-05-15',
          certification: 'UA'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(title);

      // Clean up created test movie
      await Movie.findByIdAndDelete(res.body.data._id);
    });
  });

  describe('Theatres & Screens API', () => {
    it('GET /api/v1/theatres should list theatres with city filtering', async () => {
      const res = await request(app).get('/api/v1/theatres?city=Mumbai');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((t) => t.city.toLowerCase() === 'mumbai')).toBe(true);
      expect(res.body.data[0]).toHaveProperty('screensCount');
    });

    it('GET /api/v1/theatres/cities should return distinct cities', async () => {
      const res = await request(app).get('/api/v1/theatres/cities');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toContain('Mumbai');
    });

    it('GET /api/v1/theatres/:theatreId/screens should return screens with seating layout', async () => {
      const res = await request(app).get(`/api/v1/theatres/${testTheatre._id}/screens`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('seatingLayout');
      expect(res.body.data[0].seatingLayout).toHaveProperty('rows');
      expect(res.body.data[0]).toHaveProperty('totalCapacity');
      expect(res.body.data[0].totalCapacity).toBeGreaterThan(0);
    });
  });

  describe('Show Scheduling & Conflict Prevention', () => {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 10); // 10 days in future to avoid existing seed
    testDate.setUTCHours(0, 0, 0, 0);

    let scheduledShowId = null;

    it('POST /api/v1/shows should schedule a new valid show', async () => {
      const res = await request(app)
        .post('/api/v1/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          movieId: testMovie._id,
          theatreId: testTheatre._id,
          screenId: testScreen._id,
          showDate: testDate.toISOString(),
          startTime: '13:00',
          pricing: {
            standard: 200,
            premium: 320,
            vip: 500
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('endTime');
      expect(res.body.data.startTime).toBe('13:00');
      scheduledShowId = res.body.data._id;
    });

    it('POST /api/v1/shows should reject overlapping show on same screen with 409 Conflict', async () => {
      // The show at 13:00 runs for ~169 mins + 20 min turnaround = until ~16:09.
      // Scheduling a show at 14:30 on the same screen MUST trigger a schedule conflict!
      const res = await request(app)
        .post('/api/v1/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          movieId: testMovie._id,
          theatreId: testTheatre._id,
          screenId: testScreen._id,
          showDate: testDate.toISOString(),
          startTime: '14:30', // Overlaps with 13:00 - 16:09!
          pricing: {
            standard: 200,
            premium: 320,
            vip: 500
          }
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/schedule conflict/i);
    });

    it('POST /api/v1/shows should allow non-overlapping show on same screen after turnaround', async () => {
      // 17:00 is comfortably after the previous show finishes
      const res = await request(app)
        .post('/api/v1/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          movieId: testMovie._id,
          theatreId: testTheatre._id,
          screenId: testScreen._id,
          showDate: testDate.toISOString(),
          startTime: '17:00',
          pricing: {
            standard: 200,
            premium: 320,
            vip: 500
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      // Clean up test shows
      await Show.deleteMany({ _id: { $in: [scheduledShowId, res.body.data._id] } });
    });
  });
});
