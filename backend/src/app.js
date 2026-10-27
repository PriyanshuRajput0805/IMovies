import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movie.routes.js';
import theatreRoutes from './routes/theatre.routes.js';
import screenRoutes from './routes/screen.routes.js';
import showRoutes from './routes/show.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Body parsers with safe limits
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Serve static uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// General rate limiter for all API endpoints
app.use('/api/', apiLimiter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'IMovies Cinema Management & Online Movie Ticket Booking API',
    version: '1.0.0',
    documentation: '/api/v1',
    healthCheck: '/api/v1/health'
  });
});

// API v1 Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/theatres', theatreRoutes);
app.use('/api/v1/screens', screenRoutes);
app.use('/api/v1/shows', showRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
