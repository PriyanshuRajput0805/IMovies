import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';
import { logger } from './utils/logger.js';

const httpServer = http.createServer(app);

// Attach Socket.IO
initSocket(httpServer);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP listener
    httpServer.listen(env.PORT, () => {
      logger.success(`====================================================`);
      logger.success(`  IMovies API Server running on port ${env.PORT} (${env.NODE_ENV})`);
      logger.success(`  Health Check: http://localhost:${env.PORT}/api/v1/health`);
      logger.success(`  Client URL:   ${env.CLIENT_URL}`);
      logger.success(`====================================================`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force shutdown if taking too long
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
