import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getDBStatus } from '../config/db.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Detailed application health check and diagnostics
 * @access  Public
 */
router.get('/', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbStatus = getDBStatus();

  const healthData = {
    service: 'IMovies REST API & Realtime Service',
    status: dbStatus.status === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: '1.0.0',
    database: dbStatus,
    memory: {
      rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
    }
  };

  const statusCode = dbStatus.status === 'connected' ? 200 : 503;
  return res.status(statusCode).json(ApiResponse.success(healthData, 'Health check passed', statusCode));
});

/**
 * @route   GET /api/v1/health/ping
 * @desc    Lightweight ping endpoint for uptime monitors
 * @access  Public
 */
router.get('/ping', (req, res) => {
  return res.status(200).json(ApiResponse.success({ pong: true }, 'Pong'));
});

export default router;
