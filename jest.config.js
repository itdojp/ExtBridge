/**
 * ExtBridge - Jestテスト設定
 */

module.exports = {
  // テスト環境
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|@babel)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  
  // テストファイルのパターン
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
    '**/*.test.js',
    '**/*.spec.js',
    '!**/src/ui/**/*.test.js',
    '!**/src/ui/**/*.spec.js'
  ],
  
  // テストから除外するパス
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/ui/'
  ],
  
  // カバレッジ設定
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/ui/**', // UIコンポーネントはフロントエンドテストで対応
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/test/**',
    '!**/tests/**'
  ],
  
  // モジュールエイリアス設定
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@services$': '<rootDir>/src/services/index.js',
    '^@services/github/githubClient$': '<rootDir>/src/services/github/githubClient.js',
    '^@services/github/githubClient(.*)$': '<rootDir>/src/services/github/githubClient$1'
  },
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/testSetup.js'],
  
  // テスト実行時間の制限（ミリ秒）
  testTimeout: 30000, // 30秒に延長
  clearMocks: true,
  resetMocks: true,
  resetModules: true,
  globalTeardown: '<rootDir>/tests/testTeardown.js',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/ui/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/mocks/**',
    '!**/__mocks__/**'
  ],
  maxConcurrency: 1,
  maxWorkers: 1,
  verbose: true
};
