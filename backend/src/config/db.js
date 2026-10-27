import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

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
 * Initialize in-memory MongoDB server (useful for testing or offline development)
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
  // If explicitly requested or running in test mode with known non-resolving URI
  const isTestOrLocalOnly = process.env.NODE_ENV === 'test' && (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('chat-db.8ywxpr8'));
  
  if (isTestOrLocalOnly) {
    try {
      const memUri = await startMemoryServer();
      currentDbUri = memUri;
      const conn = await mongoose.connect(memUri);
      dbConnectionMode = 'In-Memory MongoMemoryServer';
      logger.success(`Connected to In-Memory MongoDB for testing: ${memUri}`);
      return conn;
    } catch (memErr) {
      logger.error(`Failed to start in-memory database: ${memErr.message}`);
      throw memErr;
    }
  }

  const targetUri = sanitizeMongoUri(env.MONGODB_URI);
  currentDbUri = targetUri;

  const mongooseOptions = {
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000,
  };

  try {
    logger.info(`Attempting to connect to MongoDB... (${targetUri.replace(/:([^:@]+)@/, ':****@')})`);
    const conn = await mongoose.connect(targetUri, mongooseOptions);
    dbConnectionMode = targetUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB';
    logger.success(`MongoDB Connected successfully: ${conn.connection.host} [${dbConnectionMode}]`);
    return conn;
  } catch (primaryErr) {
    logger.warn(`Primary MongoDB connection failed (${primaryErr.message}). Falling back to In-Memory MongoDB for local development.`);

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
