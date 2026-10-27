import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';

describe('Authentication & Authorization API (Phase 2)', () => {
  let customerToken = '';
  let customerUser = null;
  let adminToken = '';
  const testCustomerEmail = `test_${Date.now()}@example.com`;
  const testAdminEmail = `admin_${Date.now()}@example.com`;

  beforeAll(async () => {
    await connectDB();
  }, 60000);

  afterAll(async () => {
    // Clean up test users
    await User.deleteMany({ email: { $in: [testCustomerEmail, testAdminEmail] } });
    await disconnectDB();
  }, 10000);

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with 201 Created and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: testCustomerEmail,
          password: 'Password123!',
          phone: '+91 9988776655'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(testCustomerEmail);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      customerToken = res.body.data.accessToken;
      customerUser = res.body.data.user;
    });

    it('should reject registration with duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Jane',
          email: testCustomerEmail,
          password: 'AnotherPassword123!'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with short password with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass',
          email: 'shortpass@example.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
    });

    it('should reject registration with invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'ValidPassword123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate with valid credentials and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testCustomerEmail);
    });

    it('should reject login with wrong password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'IncorrectPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user profile when valid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testCustomerEmail);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    beforeAll(async () => {
      // Create admin user for testing
      const admin = await User.create({
        name: 'Test Administrator',
        email: testAdminEmail,
        password: 'AdminPassword123!',
        role: 'admin',
        accountStatus: 'active'
      });
      adminToken = admin.generateAccessToken();
    });

    it('should block customer role from accessing admin-check with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-check')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it('should allow admin role to access admin-check with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.adminAccessGranted).toBe(true);
    });
  });

  describe('PATCH /api/v1/auth/profile and Password Change', () => {
    it('should allow user to update their name and phone', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Jane Updated Doe',
          phone: '+91 99999 11111'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Jane Updated Doe');
      expect(res.body.data.user.phone).toBe('+91 99999 11111');
    });

    it('should successfully change password and allow login with new password', async () => {
      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'BrandNewPassword456!'
        });

      expect(changeRes.statusCode).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Verify login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'BrandNewPassword456!'
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });
  });
});
