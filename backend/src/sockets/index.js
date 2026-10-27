import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let io = null;

/**
 * Initialize Socket.IO with CORS and event handlers
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join show room for real-time seat availability updates
    socket.on('join_show', (showId) => {
      if (showId) {
        const room = `show:${showId}`;
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined room ${room}`);
      }
    });

    // Leave show room
    socket.on('leave_show', (showId) => {
      if (showId) {
        const room = `show:${showId}`;
        socket.leave(room);
        logger.debug(`Socket ${socket.id} left room ${room}`);
      }
    });

    // Join user-specific notification room
    socket.on('join_user', (userId) => {
      if (userId) {
        const room = `user:${userId}`;
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined user room ${room}`);
      }
    });

    // Disconnect event
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.success('Socket.IO initialized successfully');
  return io;
};

/**
 * Get active Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return io;
};

/**
 * Broadcast seat lock event to all users viewing a specific show
 */
export const broadcastSeatLock = (showId, { seats, lockedUntil, lockedBy }) => {
  if (!io) return;
  io.to(`show:${showId}`).emit('seats_locked', {
    showId,
    seats,
    lockedUntil,
    lockedBy
  });
};

/**
 * Broadcast seat unlock / release event to all users viewing a specific show
 */
export const broadcastSeatUnlock = (showId, { seats }) => {
  if (!io) return;
  io.to(`show:${showId}`).emit('seats_unlocked', {
    showId,
    seats
  });
};

/**
 * Broadcast confirmed booking event to all users viewing a specific show
 */
export const broadcastBookingConfirmed = (showId, { seats }) => {
  if (!io) return;
  io.to(`show:${showId}`).emit('seats_booked', {
    showId,
    seats
  });
};

/**
 * Emit private notification to a specific user
 */
export const emitUserNotification = (userId, notification) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('user_notification', notification);
};
