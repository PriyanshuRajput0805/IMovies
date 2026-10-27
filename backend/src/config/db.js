import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Configure reliable DNS servers for MongoDB Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  logger.warn(`Could not set custom DNS servers: ${dnsErr.message}`);
}

let mongodInstance = null;
let currentDbUri = null;
let dbConnectionMode = 'disconnected';

/**
 * Clean up URI: remove angle brackets if user left template `<password>`
 */
const sanitizeMongoUri = (rawUri) => {
  if (!rawUri) return rawUri;
  let cleaned = rawUri.replace(/<([^>]+)>/g, '$1');
  if (cleaned.endsWith('.mongodb.net/')) {
    cleaned = cleaned + 'imovies?retryWrites=true&w=majority';
  }
  return cleaned;
};

/**
 * Initialize in-memory MongoDB server (fallback for testing or offline dev)
 */
export const startMemoryServer = async () => {
  if (mongodInstance) {
    return mongodInstance.getUri();
  }
  logger.info('Starting MongoMemoryServer...');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongodInstance = await MongoMemoryServer.create({
    instance: {
      dbName: 'imovies',
      startupTimeout: 60000
    }
  });
  return mongodInstance.getUri();
};

/**
 * Connect to MongoDB with automatic fallback in development/test if Atlas or local is unavailable
 */
export const connectDB = async () => {
  const targetUri = sanitizeMongoUri(env.MONGODB_URI);
  currentDbUri = targetUri;

  const mongooseOptions = {
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 6000,
  };

  try {
    const maskedUri = targetUri.replace(/:([^:@]+)@/, ':****@');
    logger.info(`Attempting to connect to MongoDB... (${maskedUri})`);
    const conn = await mongoose.connect(targetUri, mongooseOptions);
    dbConnectionMode = targetUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB';
    logger.success(`MongoDB Connected successfully: ${conn.connection.host} [${dbConnectionMode}]`);
    return conn;
  } catch (primaryErr) {
    logger.warn(`Primary MongoDB connection failed (${primaryErr.message}). Falling back to In-Memory MongoDB.`);

    try {
      const memUri = await startMemoryServer();
      currentDbUri = memUri;
      const conn = await mongoose.connect(memUri);
      dbConnectionMode = 'In-Memory MongoMemoryServer (Development Fallback)';
      logger.success(`Connected to In-Memory MongoDB: ${memUri} [${dbConnectionMode}]`);
      return conn;
    } catch (memErr) {
      logger.error(`MongoMemoryServer fallback failed: ${memErr.message}`);
      throw primaryErr;
    }
  }
};

/**
 * Disconnect from MongoDB and stop memory server if running
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    dbConnectionMode = 'disconnected';
    logger.info('MongoDB disconnected.');
  } catch (err) {
    logger.error(`Error disconnecting MongoDB: ${err.message}`);
  }
};

/**
 * Get current database status for health check
 */
export const getDBStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const readyState = mongoose.connection.readyState;
  return {
    status: stateMap[readyState] || 'unknown',
    readyState,
    mode: dbConnectionMode,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};
