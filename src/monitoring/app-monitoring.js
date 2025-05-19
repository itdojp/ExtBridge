/**
 * Application monitoring and logging module
 */

const logger = {
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta),
  info: (message, meta) => console.log(`[INFO] ${message}`, meta),
  debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta),
  verbose: (message, meta) => console.log(`[VERBOSE] ${message}`, meta)
};

module.exports = {
  logger
};
