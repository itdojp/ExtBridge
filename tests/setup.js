/**
 * ExtBridge - テストセットアップファイル
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.JWT_SECRET = 'test-jwt-secret';

// グローバル変数としてMongoDBメモリサーバーを保持
let mongoServer;

// テスト開始前にMongoDBメモリサーバーを起動
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  
  // グローバル変数としても保持（必要に応じて）
  global.mongoServer = mongoServer;
});

// テスト終了後にMongoDBメモリサーバーを停止
afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// グローバルタイムアウトの設定
jest.setTimeout(30000); // 30秒に設定

// コンソール出力のモック化（テスト出力をクリーンに保つ）
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // エラーと警告は表示する
  error: console.error,
  warn: console.warn,
};
