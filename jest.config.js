/**
 * ExtBridge - Jestテスト設定
 */

module.exports = {
  // テスト環境
  testEnvironment: 'node',
  
  // テストファイルのパターン
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // カバレッジ設定
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/ui/**/*.js', // UIコンポーネントはフロントエンドテストで対応
    '!**/node_modules/**'
  ],
  
  // モック設定
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // テスト実行時間の制限（秒）
  testTimeout: 10000,
  
  // 詳細なレポート
  verbose: true
};
