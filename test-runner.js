// Simple test runner
console.log('Starting test runner...');

// Load Jest programmatically
const { runCLI } = require('jest');
const path = require('path');

const config = {
  rootDir: __dirname,
  testMatch: ['**/extic-client.test.js'],
  verbose: true,
  testEnvironment: 'node',
  resetMocks: true,
  clearMocks: true,
  resetModules: true,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {}
};

// Run the tests
runCLI(config, [path.resolve(__dirname)])
  .then(({ results }) => {
    console.log('Test results:', results);
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
