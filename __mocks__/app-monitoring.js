// Mock for app-monitoring module
const logger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

module.exports = {
  logger
};
