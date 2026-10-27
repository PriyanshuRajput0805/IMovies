/**
 * Structured logger utility with timestamp and levels
 */
const logLevels = {
  INFO: '\x1b[36m[INFO]\x1b[0m',
  SUCCESS: '\x1b[32m[SUCCESS]\x1b[0m',
  WARN: '\x1b[33m[WARN]\x1b[0m',
  ERROR: '\x1b[31m[ERROR]\x1b[0m',
  DEBUG: '\x1b[35m[DEBUG]\x1b[0m'
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level} ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => console.log(formatMessage(logLevels.INFO, message, meta)),
  success: (message, meta) => console.log(formatMessage(logLevels.SUCCESS, message, meta)),
  warn: (message, meta) => console.warn(formatMessage(logLevels.WARN, message, meta)),
  error: (message, meta) => console.error(formatMessage(logLevels.ERROR, message, meta)),
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage(logLevels.DEBUG, message, meta));
    }
  }
};
